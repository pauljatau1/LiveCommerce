const Stream = require('../models/Stream');
const Analytics = require('../models/Analytics');
const mixpanel = require('../config/mixpanel');



/**
 * @desc    Get total number of livestreams by date range
 * @route   GET /api/analytics/livestreams
 * @access  Private/Admin
 */
exports.getLivestreamsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate parameters'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const streams = await Stream.find({
      endTime: {
        $gte: start,
        $lte: end
      },
      status: 'ended'
    });

    // Group streams by date
    const streamsByDate = {};

    streams.forEach(stream => {
      const streamDate = new Date(stream.endTime).toISOString().split('T')[0];

      if (!streamsByDate[streamDate]) {
        streamsByDate[streamDate] = [];
      }

      streamsByDate[streamDate].push({
        id: stream._id,
        title: stream.title,
        seller: stream.seller,
        startTime: stream.actualStartTime,
        endTime: stream.endTime,
        viewers: stream.viewers.length,
        departedViewers: stream.departedViewers.length,
        totalOrders: stream.orders.length
      });
    });

    // Transform into array format with totals
    const results = Object.keys(streamsByDate).map(date => ({
      date,
      totalLivestreams: streamsByDate[date].length,
      streams: streamsByDate[date]
    }));

    return res.status(200).json({
      success: true,
      data: {
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        totalDays: results.length,
        totalLivestreams: streams.length,
        results
      }
    });
  } catch (error) {
    console.error('Error in getLivestreamsByDateRange:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Get weekly livestream analytics
 * @route   GET /api/analytics/livestreams/weekly
 * @access  Private/Admin
 */
exports.getWeeklyLivestreamAnalytics = async (req, res) => {
  try {
    // Get week parameter (optional) in format YYYY-WW (e.g., 2023-01 for first week of 2023)
    const weekParam = req.query.week;
    let startOfWeek, endOfWeek, weekYear, weekNumber;

    if (weekParam) {
      // Parse week in YYYY-WW format using regex
      const weekRegex = /^(\d{4})-(\d{2})$/;
      const match = weekParam.match(weekRegex);

      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Invalid week format. Expected format: YYYY-WW (e.g., 2023-01 for first week of 2023)'
        });
      }

      weekYear = parseInt(match[1]);
      weekNumber = parseInt(match[2]);

      // Validate week number (1-53)
      if (weekNumber < 1 || weekNumber > 53) {
        return res.status(400).json({
          success: false,
          message: 'Invalid week number. Week number must be between 1 and 53.'
        });
      }

      // Get the first day of the year
      const firstDayOfYear = new Date(Date.UTC(weekYear, 0, 1));

      // Calculate the first day of the week (ISO weeks start on Monday)
      // Adjust to previous Monday if firstDayOfYear is not Monday
      const dayOfWeek = firstDayOfYear.getDay() || 7; // Convert Sunday (0) to 7
      const daysToAdd = (weekNumber - 1) * 7 + (dayOfWeek === 1 ? 0 : 1 - dayOfWeek);

      startOfWeek = new Date(firstDayOfYear);
      startOfWeek.setUTCDate(firstDayOfYear.getUTCDate() + daysToAdd);
      startOfWeek.setUTCHours(0, 0, 0, 0);

      endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      endOfWeek.setUTCHours(23, 59, 59, 999);

      // Check if the requested week is the current week (incomplete)
      const now = new Date();
      if (now >= startOfWeek && now <= endOfWeek) {
        return res.status(400).json({
          success: false,
          message: 'Cannot retrieve analytics for the current week as it is incomplete. Please request data for a previous complete week.'
        });
      }
    } else {
      // Use previous week
      const now = new Date();
      const dayOfWeek = now.getUTCDay() || 7; // Convert Sunday (0) to 7

      // Set to previous week's Monday
      startOfWeek = new Date(now);
      startOfWeek.setUTCDate(now.getUTCDate() - dayOfWeek - 6); // Go to Monday of previous week
      startOfWeek.setUTCHours(0, 0, 0, 0);

      // Set to previous week's Sunday
      endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      endOfWeek.setUTCHours(23, 59, 59, 999);

      // Calculate week number for previous week
      const firstDayOfYear = new Date(Date.UTC(startOfWeek.getUTCFullYear(), 0, 1));
      const daysSinceFirstDay = Math.floor((startOfWeek - firstDayOfYear) / (24 * 60 * 60 * 1000));
      weekNumber = Math.ceil((daysSinceFirstDay + (firstDayOfYear.getDay() || 7) - 1) / 7);
      weekYear = startOfWeek.getUTCFullYear();
    }

    // Create array of the 7 days in the week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    // Format as ISO week string (e.g., 2023-W01)
    const formattedWeek = `${weekYear}-W${weekNumber.toString().padStart(2, '0')}`;
    // Also create YYYY-WW format for backward compatibility
    const legacyWeekFormat = `${weekYear}-${weekNumber.toString().padStart(2, '0')}`;

    console.log(`Finding livestreams for week ${formattedWeek} between ${startOfWeek.toISOString()} and ${endOfWeek.toISOString()}`);

    // Find all streams that were active during the week
    const streams = await Stream.find({
      $or: [
        // Live streams that started during this week
        {
          status: 'live',
          actualStartTime: {
            $gte: startOfWeek,
            $lte: endOfWeek
          }
        },
        // Ended streams that started during this week
        {
          status: 'ended',
          actualStartTime: {
            $gte: startOfWeek,
            $lte: endOfWeek
          }
        },
        // Ended streams that ended during this week
        {
          status: 'ended',
          endTime: {
            $gte: startOfWeek,
            $lte: endOfWeek
          }
        },
        // Streams that were active spanning this entire week (started before, ended after)
        {
          status: 'ended',
          actualStartTime: { $lt: startOfWeek },
          endTime: { $gt: endOfWeek }
        }
      ]
    });

    const totalLivestreams = streams.length;
    const totalAuctionStreams = streams.filter(stream => stream.type === 'auction').length;
    const totalOpenShowStreams = streams.filter(stream => stream.type === 'open_show').length;

    // Check if we already have a weekly analytics record
    let analyticsRecord = await Analytics.findOne({
      type: 'livestream_weekly',
      $or: [
        { 'metadata.week': formattedWeek },
        { 'metadata.week': legacyWeekFormat }
      ]
    });

    if (!analyticsRecord) {
      // Calculate total and unique viewers
      const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
      const totalUniqueViewers = [...new Set([
        ...streams.flatMap(stream => stream.viewers.map(v => v.toString())),
        ...streams.flatMap(stream => stream.departedViewers.map(v => v.buyer?.toString()).filter(Boolean))
      ])].length;

      // Calculate daily breakdown
      const dailyData = {};

      // Initialize daily data
      weekDays.forEach(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(day);
        const formattedDate = day.toISOString().split('T')[0];

        dailyData[formattedDate] = {
          total: 0,
          auction: 0,
          open_show: 0,
          daily_orders: 0,
          dayOfWeek: dayName,
          date: formattedDate,
          start: dayStart.toISOString(),
          end: dayEnd.toISOString()
        };
      });

      // Count streams by day
      streams.forEach(stream => {
        // For active streams, count it for the current day
        // For ended streams, count it for the day it ended
        const streamDate = stream.status === 'live' ?
          new Date() :
          new Date(stream.endTime || stream.actualStartTime);

        // If stream is outside the week range, skip it
        if (streamDate < startOfWeek || streamDate > endOfWeek) return;

        const formattedDate = streamDate.toISOString().split('T')[0];

        // Check if the date exists in our daily data
        if (dailyData[formattedDate]) {
          dailyData[formattedDate].total++;

          if (stream.type === 'auction') {
            dailyData[formattedDate].auction++;
          } else if (stream.type === 'open_show') {
            dailyData[formattedDate].open_show++;
          }

          if (stream.orders.length > 0) {
            console.log('stream.orders.length', stream.orders.length);
            dailyData[formattedDate].daily_orders += stream.orders.length;
          }
        }
      });

      // Calculate averages
      const avgViewersPerStream = totalLivestreams > 0 ? totalViewers / totalLivestreams : 0;
      const avgStreamDuration = totalLivestreams > 0 ?
        streams.reduce((acc, stream) => {
          if (stream.endTime && stream.actualStartTime) {
            return acc + (new Date(stream.endTime) - new Date(stream.actualStartTime)) / (1000 * 60);
          }
          return acc;
        }, 0) / totalLivestreams : 0;

      analyticsRecord = new Analytics({
        type: 'livestream_weekly',
        date: startOfWeek,
        data: {
          totalLivestreams,
          totalAuctionStreams,
          totalOpenShowStreams,
          totalViewers,
          totalUniqueViewers,
          avgViewersPerStream,
          avgStreamDuration: `${Math.round(avgStreamDuration)} minutes`,
          dailyData,
          totalOrders: streams.reduce((acc, stream) => acc + stream.orders.length, 0),
          streams: streams.map(stream => ({
            id: stream._id,
            title: stream.title,
            sellerId: stream.seller,
            type: stream.type,
            startTime: stream.actualStartTime,
            endTime: stream.endTime || null,
            status: stream.status,
            viewers: stream.viewers.length,
            departedViewers: stream.departedViewers.length,
            ordersAmount: stream.orders.length
          }))
        },
        metadata: {
          week: formattedWeek,
          legacyWeekFormat,
          year: weekYear,
          weekNumber,
          timeRange: {
            start: startOfWeek.toISOString(),
            end: endOfWeek.toISOString()
          }
        }
      });

      await analyticsRecord.save();
      console.log(`Created new weekly analytics record for ${formattedWeek} with ${totalLivestreams} livestreams`);
    } else {
      console.log(`Weekly analytics record already exists for ${formattedWeek}`);
    }

    // Track in Mixpanel if it wasn't already tracked
    if (!analyticsRecord.trackedInMixpanel) {
      try {
        const dailyBreakdown = Object.entries(analyticsRecord.data.dailyData).map(([date, data]) => ({
          date,
          day_of_week: data.dayOfWeek,
          total_streams: data.total,
          auction_streams: data.auction,
          open_show_streams: data.open_show
        }));

        // Track weekly livestream analytics event
        mixpanel.track('weekly_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          total_auction_streams: totalAuctionStreams,
          total_open_show_streams: totalOpenShowStreams,
          week: formattedWeek,
          year: weekYear,
          week_number: weekNumber,
          total_viewers: analyticsRecord.data.totalViewers,
          total_unique_viewers: analyticsRecord.data.totalUniqueViewers,
          daily_breakdown: dailyBreakdown,
          avg_viewers_per_stream: analyticsRecord.data.avgViewersPerStream,
          avg_stream_duration_minutes: analyticsRecord.data.avgStreamDuration,
          total_orders: analyticsRecord.data.totalOrders
        });

        // Mark as tracked in Mixpanel
        analyticsRecord.trackedInMixpanel = true;
        await analyticsRecord.save();

        console.log(`Tracked weekly livestream analytics in Mixpanel for ${formattedWeek}`);
      } catch (mixpanelError) {
        console.error('Error tracking weekly analytics in Mixpanel:', mixpanelError);
      }
    }

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        week: formattedWeek,
        year: weekYear,
        weekNumber,
        timeRange: {
          start: startOfWeek.toISOString(),
          end: endOfWeek.toISOString()
        },
        totalLivestreams,
        totalAuctionStreams,
        totalOpenShowStreams,
        ...analyticsRecord.data
      }
    });
  } catch (error) {
    console.error('Error in getWeeklyLivestreamAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Get monthly livestream analytics
 * @route   GET /api/analytics/livestreams/monthly
 * @access  Private/Admin
 */
exports.getMonthlyLivestreamAnalytics = async (req, res) => {
  try {
    // Parse the month parameter (optional)
    const monthParam = req.query.month;

    // Get current date
    const today = new Date();
    let monthStart, monthEnd, month, year;

    if (monthParam) {
      // Format should be YYYY-MM (e.g., 2023-01 for January 2023)
      const match = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month format. Expected format: YYYY-MM (e.g., 2023-01)'
        });
      }

      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1; // JavaScript months are 0-based

      // Check if requested month is the current month (incomplete)
      const currentYear = today.getUTCFullYear();
      const currentMonth = today.getUTCMonth();

      if (year === currentYear && month === currentMonth) {
        return res.status(400).json({
          success: false,
          message: 'Cannot retrieve analytics for the current month as it is incomplete. Please request data for a previous complete month.'
        });
      }

      monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      // Last day of month: Get first day of next month, then subtract 1 millisecond
      monthEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
      monthEnd.setUTCMilliseconds(-1); // Set to 23:59:59.999 of last day
    } else {
      // Get the previous month
      if (today.getUTCMonth() === 0) {
        // If current month is January, previous month is December of previous year
        year = today.getUTCFullYear() - 1;
        month = 11; // December (0-based)
      } else {
        year = today.getUTCFullYear();
        month = today.getUTCMonth() - 1;
      }

      monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      // Last day of month: Get first day of next month, then subtract 1 millisecond
      monthEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
      monthEnd.setUTCMilliseconds(-1); // Set to 23:59:59.999 of last day
    }

    // Format for display
    const monthId = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

    console.log(`Analyzing livestreams for ${monthName} ${year} from ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

    // Find all streams that were active within the target month
    const streams = await Stream.find({
      $or: [
        // Live streams that started during this month
        {
          status: 'live',
          actualStartTime: {
            $gte: monthStart,
            $lte: monthEnd
          }
        },
        // Ended streams that started during this month
        {
          status: 'ended',
          actualStartTime: {
            $gte: monthStart,
            $lte: monthEnd
          }
        },
        // Ended streams that ended during this month
        {
          status: 'ended',
          endTime: {
            $gte: monthStart,
            $lte: monthEnd
          }
        },
        // Streams that were active spanning this entire month (started before, ended after)
        {
          status: 'ended',
          actualStartTime: { $lt: monthStart },
          endTime: { $gt: monthEnd }
        }
      ]
    });

    const totalLivestreams = streams.length;
    const totalAuctionStreams = streams.filter(stream => stream.type === 'auction').length;
    const totalOpenShowStreams = streams.filter(stream => stream.type === 'open_show').length;

    // Check if we already have a monthly analytics record
    let analyticsRecord = await Analytics.findOne({
      type: 'livestream_monthly',
      'metadata.monthId': monthId
    });

    // If no record exists, create one
    if (!analyticsRecord) {
      // Calculate total and unique viewers
      const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
      const totalUniqueViewers = [...new Set([
        ...streams.flatMap(stream => stream.viewers.map(v => v.toString())),
        ...streams.flatMap(stream => stream.departedViewers.map(v => v.buyer?.toString()).filter(Boolean))
      ])].length;

      // Calculate weekly breakdown
      const weeklyData = {};

      // Get number of weeks in the month
      const numWeeks = Math.ceil((monthEnd.getDate() - monthStart.getDate() + 1) / 7);

      // Initialize weekly data
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(monthStart);
        weekStart.setDate(monthStart.getDate() + (i * 7));

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Adjust if weekEnd goes into next month
        if (weekEnd > monthEnd) {
          weekEnd.setTime(monthEnd.getTime());
        }

        const weekKey = `Week ${i + 1}: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;

        weeklyData[weekKey] = {
          total: 0,
          auction: 0,
          open_show: 0,
          weekly_orders: 0,
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        };
      }

      // Count streams by week
      streams.forEach(stream => {
        // For live streams, use the current time
        // For ended streams, use the end time
        const streamTime = stream.status === 'live' ? new Date() : new Date(stream.endTime);

        // Skip if outside our month range
        if (streamTime < monthStart || streamTime > monthEnd) return;

        // Find which week this stream belongs to
        for (const [weekKey, weekData] of Object.entries(weeklyData)) {
          const weekStart = new Date(weekData.start);
          const weekEnd = new Date(weekData.end);

          if (streamTime >= weekStart && streamTime <= weekEnd) {
            weeklyData[weekKey].total++;

            if (stream.type === 'auction') {
              weeklyData[weekKey].auction++;
            } else if (stream.type === 'open_show') {
              weeklyData[weekKey].open_show++;
            }

            if (stream.orders.length > 0) {
              weeklyData[weekKey].weekly_orders += stream.orders.length;
            }

            break;
          }
        }
      });

      // Calculate averages
      const avgViewersPerStream = totalLivestreams > 0 ? totalViewers / totalLivestreams : 0;
      const avgStreamDuration = totalLivestreams > 0 ?
        streams.reduce((acc, stream) => {
          if (stream.endTime && stream.actualStartTime) {
            return acc + (new Date(stream.endTime) - new Date(stream.actualStartTime)) / (1000 * 60);
          }
          return acc;
        }, 0) / totalLivestreams : 0;

      analyticsRecord = new Analytics({
        type: 'livestream_monthly',
        date: new Date(),
        data: {
          totalLivestreams,
          totalAuctionStreams,
          totalOpenShowStreams,
          totalViewers,
          totalUniqueViewers,
          avgViewersPerStream,
          avgStreamDuration: `${Math.round(avgStreamDuration)} minutes`,
          weeklyData,
          totalOrders: streams.reduce((acc, stream) => acc + stream.orders.length, 0),
          streams: streams.map(stream => ({
            id: stream._id,
            title: stream.title,
            sellerId: stream.seller,
            type: stream.type,
            startTime: stream.actualStartTime,
            endTime: stream.endTime || null,
            status: stream.status,
            viewers: stream.viewers.length,
            departedViewers: stream.departedViewers.length,
            ordersAmount: stream.orders.length
          }))
        },
        metadata: {
          monthId,
          year,
          month: month + 1, // 1-based month for output
          monthName,
          timeRange: {
            start: monthStart.toISOString(),
            end: monthEnd.toISOString()
          }
        }
      });

      await analyticsRecord.save();
      console.log(`Created new monthly analytics record for ${monthId} with ${totalLivestreams} livestreams`);
    } else {
      console.log(`Monthly analytics record already exists for ${monthId}`);
    }

    // Track in Mixpanel if it wasn't already tracked
    if (!analyticsRecord.trackedInMixpanel) {
      try {
        const weeklyBreakdown = Object.entries(analyticsRecord.data.weeklyData).map(([week, data]) => ({
          week,
          total_streams: data.total,
          auction_streams: data.auction,
          open_show_streams: data.open_show,
          weekly_orders: data.weekly_orders,
          start_date: data.start.split('T')[0],
          end_date: data.end.split('T')[0]
        }));

        // Track monthly livestream analytics event
        mixpanel.track('monthly_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          total_auction_streams: totalAuctionStreams,
          total_open_show_streams: totalOpenShowStreams,
          month_id: monthId,
          year,
          month: month + 1,
          month_name: monthName,
          total_viewers: analyticsRecord.data.totalViewers,
          total_unique_viewers: analyticsRecord.data.totalUniqueViewers,
          weekly_breakdown: weeklyBreakdown,
          avg_viewers_per_stream: analyticsRecord.data.avgViewersPerStream,
          avg_stream_duration_minutes: analyticsRecord.data.avgStreamDuration,
          total_orders: analyticsRecord.data.totalOrders
        });

        // Mark as tracked in Mixpanel
        analyticsRecord.trackedInMixpanel = true;
        await analyticsRecord.save();

        console.log(`Tracked monthly livestream analytics in Mixpanel for ${monthId}`);
      } catch (mixpanelError) {
        console.error('Error tracking monthly analytics in Mixpanel:', mixpanelError);
      }
    }

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        monthId,
        year,
        month: month + 1,
        monthName,
        timeRange: {
          start: monthStart.toISOString(),
          end: monthEnd.toISOString()
        },
        totalLivestreams,
        totalAuctionStreams,
        totalOpenShowStreams,
        ...analyticsRecord.data
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyLivestreamAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Utility function to get the date of the first day of a week in a year
function getDateOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const date = simple;
  if (dayOfWeek <= 4) {
    date.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    date.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return date;
} 