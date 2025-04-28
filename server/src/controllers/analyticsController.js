const Stream = require('../models/Stream');
const Analytics = require('../models/Analytics');
const mixpanel = require('../config/mixpanel');

/**
 * @desc    Get total number of livestreams in the last 24 hours
 * @route   GET /api/analytics/livestreams/24h
 * @access  Private/Admin
 */
exports.getTotalNumberOfLivestreamin24Hours = async (req, res) => {
  try {
    // Get the date param if provided, otherwise use yesterday
    let targetDate = req.query.date ? new Date(req.query.date) : new Date();
    
    // If no date provided, use yesterday's date
    if (!req.query.date) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
    
    // Set to beginning of the day in local time (WAT)
    targetDate.setHours(0, 0, 0, 0);
    
    // Create end date (end of the same day)
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Finding livestreams between ${targetDate.toISOString()} and ${endDate.toISOString()}`);

    // Find all streams that ended within the target day
    const streams = await Stream.find({
      endTime: { 
        $gte: targetDate, 
        $lte: endDate 
      },
      status: 'ended'
    });

    const totalLivestreams = streams.length;
    
    // Format date as YYYY-MM-DD for easier reading
    const formattedDate = targetDate.toISOString().split('T')[0];

    // Check if we already have an analytics record for this date
    let analyticsRecord = await Analytics.findOne({
      type: 'livestream',
      date: {
        $gte: targetDate,
        $lte: endDate
      }
    });

    // If no record exists, create one
    if (!analyticsRecord) {
      analyticsRecord = new Analytics({
        type: 'livestream',
        date: targetDate,
        data: {
          totalLivestreams,
          streams: streams.map(stream => ({
            id: stream._id,
            title: stream.title,
            seller: stream.seller,
            startTime: stream.actualStartTime,
            endTime: stream.endTime,
            viewers: stream.viewers.length,
            departedViewers: stream.departedViewers.length,
            totalUniqueViewers: [...new Set([
              ...stream.viewers.map(v => v.toString()),
              ...stream.departedViewers.map(v => v.buyer?.toString()).filter(Boolean)
            ])].length
          }))
        },
        metadata: {
          query: {
            startDate: targetDate,
            endDate: endDate
          }
        }
      });
      
      await analyticsRecord.save();
      console.log(`Created new analytics record for ${formattedDate} with ${totalLivestreams} livestreams`);
    } else {
      console.log(`Analytics record already exists for ${formattedDate}`);
    }

    // Track in Mixpanel if it wasn't already tracked
    if (!analyticsRecord.trackedInMixpanel) {
      try {
        const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
        
        mixpanel.track('daily_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          assigned_date: formattedDate,
          day_of_week: targetDate.getDay(),
          total_viewers: totalViewers,
        });
        
        // Mark as tracked in Mixpanel
        analyticsRecord.trackedInMixpanel = true;
        await analyticsRecord.save();
        
        console.log(`Tracked livestream analytics in Mixpanel for ${formattedDate}`);
      } catch (mixpanelError) {
        console.error('Error tracking in Mixpanel:', mixpanelError);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        date: formattedDate,
        totalLivestreams,
        streams: streams.map(stream => ({
          id: stream._id,
          title: stream.title,
          seller: stream.seller,
          duration: stream.endTime && stream.actualStartTime ? 
            Math.floor((new Date(stream.endTime) - new Date(stream.actualStartTime)) / (1000 * 60)) + ' minutes' : 
            'Unknown'
        }))
      }
    });
  } catch (error) {
    console.error('Error in getTotalNumberOfLivestreamin24Hours:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

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
        departedViewers: stream.departedViewers.length
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
 * @desc    Get livestreams analytics for a specific week
 * @route   GET /api/analytics/livestreams/weekly
 * @access  Private/Admin
 */
exports.getWeeklyLivestreamAnalytics = async (req, res) => {
  try {
    // Get the week param (YYYY-WW format) if provided, otherwise use last week
    const thisWeek = new Date();
    let weekParam = req.query.week;
    let year, weekNumber;
    
    if (weekParam) {
      // Parse YYYY-WW format
      [year, weekNumber] = weekParam.split('-').map(Number);
    } else {
      // Calculate last week
      thisWeek.setDate(thisWeek.getDate() - 7);
      year = thisWeek.getFullYear();
      
      // Get ISO week number (1-53)
      const startOfYear = new Date(thisWeek.getFullYear(), 0, 1);
      const days = Math.floor((thisWeek - startOfYear) / (24 * 60 * 60 * 1000));
      weekNumber = Math.ceil((thisWeek.getDay() + 1 + days) / 7);
    }

    // Calculate start and end dates for the specified week
    const startDate = getDateOfISOWeek(weekNumber, year);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    // Format for display
    const formattedWeek = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    console.log(`Finding livestreams for week ${formattedWeek} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // Find all streams that ended within the target week
    const streams = await Stream.find({
      endTime: { 
        $gte: startDate, 
        $lte: endDate 
      },
      status: 'ended'
    });

    const totalLivestreams = streams.length;
    
    // Check if we already have an analytics record for this week
    let analyticsRecord = await Analytics.findOne({
      type: 'livestream_weekly',
      'metadata.week': formattedWeek
    });

    // If no record exists, create one
    if (!analyticsRecord) {
      // Get daily stream counts
      const dailyStreamCounts = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        const dayFormatted = day.toISOString().split('T')[0];
        dailyStreamCounts[dayFormatted] = 0;
      }
      
      // Count streams by day
      streams.forEach(stream => {
        const streamDay = new Date(stream.endTime).toISOString().split('T')[0];
        if (dailyStreamCounts[streamDay] !== undefined) {
          dailyStreamCounts[streamDay]++;
        }
      });

      // Calculate stats
      const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
      const totalUniqueViewers = [...new Set([
        ...streams.flatMap(stream => stream.viewers.map(v => v.toString())),
        ...streams.flatMap(stream => stream.departedViewers.map(v => v.buyer?.toString()).filter(Boolean))
      ])].length;
      
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
        date: startDate,  // Use the start date of the week
        data: {
          totalLivestreams,
          totalViewers,
          totalUniqueViewers,
          avgViewersPerStream,
          avgStreamDuration: `${Math.round(avgStreamDuration)} minutes`,
          dailyStreamCounts,
          streams: streams.map(stream => ({
            id: stream._id,
            title: stream.title,
            sellerId: stream.seller,
            startTime: stream.actualStartTime,
            endTime: stream.endTime,
            viewers: stream.viewers.length,
            departedViewers: stream.departedViewers.length
          }))
        },
        metadata: {
          week: formattedWeek,
          startDate,
          endDate
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
        const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
        const dailyBreakdown = Object.entries(analyticsRecord.data.dailyStreamCounts || {}).map(([date, count]) => ({
          date,
          count,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
        }));
        
        // Track weekly livestream analytics event
        mixpanel.track('weekly_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          week: formattedWeek,
          year: year,
          week_number: weekNumber,
          total_viewers: totalViewers,
          total_unique_viewers: analyticsRecord.data.totalUniqueViewers,
          daily_breakdown: dailyBreakdown,
          avg_viewers_per_stream: analyticsRecord.data.avgViewersPerStream,
          avg_stream_duration_minutes: analyticsRecord.data.avgStreamDuration,
          streams: analyticsRecord.data.streams,
          date_range: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        });
        
        // Mark as tracked in Mixpanel
        analyticsRecord.trackedInMixpanel = true;
        await analyticsRecord.save();
        
        console.log(`Tracked weekly livestream analytics in Mixpanel for ${formattedWeek}`);
      } catch (mixpanelError) {
        console.error('Error tracking weekly analytics in Mixpanel:', mixpanelError);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        week: formattedWeek,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        totalLivestreams,
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
 * @desc    Get livestreams analytics for a specific month
 * @route   GET /api/analytics/livestreams/monthly
 * @access  Private/Admin
 */
exports.getMonthlyLivestreamAnalytics = async (req, res) => {
  try {
    // Get the month param (YYYY-MM format) if provided, otherwise use last month
    const thisMonth = new Date();
    let monthParam = req.query.month;
    let year, month;
    
    if (monthParam) {
      // Parse YYYY-MM format
      [year, month] = monthParam.split('-').map(Number);
    } else {
      // Calculate last month
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      year = thisMonth.getFullYear();
      month = thisMonth.getMonth() + 1; // JavaScript months are 0-indexed
    }

    // Calculate start and end dates for the specified month
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript
    const endDate = new Date(year, month, 0); // Last day of the specified month
    endDate.setHours(23, 59, 59, 999);
    
    // Format for display
    const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    
    console.log(`Finding livestreams for ${monthName} ${year} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // Find all streams that ended within the target month
    const streams = await Stream.find({
      endTime: { 
        $gte: startDate, 
        $lte: endDate 
      },
      status: 'ended'
    });

    const totalLivestreams = streams.length;
    
    // Check if we already have an analytics record for this month
    let analyticsRecord = await Analytics.findOne({
      type: 'livestream_monthly',
      'metadata.month': formattedMonth
    });

    // If no record exists, create one
    if (!analyticsRecord) {
      // Get stream counts by week
      const weeklyData = {};
      const daysInMonth = endDate.getDate();
      
      // Group by week of month
      for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(year, month - 1, i);
        const weekOfMonth = Math.ceil(i / 7);
        const weekKey = `Week ${weekOfMonth}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            count: 0,
            dates: {
              start: i === 1 ? day.toISOString().split('T')[0] : weeklyData[weekKey]?.dates?.start
            }
          };
        }
        
        if (i % 7 === 0 || i === daysInMonth) {
          weeklyData[weekKey].dates.end = day.toISOString().split('T')[0];
        }
      }
      
      // Count streams by week
      streams.forEach(stream => {
        const streamDate = new Date(stream.endTime);
        const dayOfMonth = streamDate.getDate();
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        const weekKey = `Week ${weekOfMonth}`;
        
        if (weeklyData[weekKey]) {
          weeklyData[weekKey].count++;
        }
      });

      // Calculate stats
      const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
      const totalUniqueViewers = [...new Set([
        ...streams.flatMap(stream => stream.viewers.map(v => v.toString())),
        ...streams.flatMap(stream => stream.departedViewers.map(v => v.buyer?.toString()).filter(Boolean))
      ])].length;
      
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
        date: startDate,  // Use the start date of the month
        data: {
          totalLivestreams,
          totalViewers,
          totalUniqueViewers,
          avgViewersPerStream,
          avgStreamDuration: `${Math.round(avgStreamDuration)} minutes`,
          weeklyData,
          streams: streams.map(stream => ({
            id: stream._id,
            title: stream.title,
            sellerId: stream.seller,
            startTime: stream.actualStartTime,
            endTime: stream.endTime,
            viewers: stream.viewers.length,
            departedViewers: stream.departedViewers.length
          }))
        },
        metadata: {
          month: formattedMonth,
          monthName,
          startDate,
          endDate
        }
      });
      
      await analyticsRecord.save();
      console.log(`Created new monthly analytics record for ${monthName} ${year} with ${totalLivestreams} livestreams`);
    } else {
      console.log(`Monthly analytics record already exists for ${monthName} ${year}`);
    }

    // Track in Mixpanel if it wasn't already tracked
    if (!analyticsRecord.trackedInMixpanel) {
      try {
        const totalViewers = streams.reduce((acc, stream) => acc + stream.viewers.length, 0);
        const weeklyBreakdown = Object.entries(analyticsRecord.data.weeklyData || {}).map(([week, data]) => ({
          week,
          count: data.count,
          date_range: `${data.dates.start} to ${data.dates.end}`
        }));
        
        // Track monthly livestream analytics event
        mixpanel.track('monthly_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          month: formattedMonth,
          month_name: monthName,
          year: year,
          total_viewers: totalViewers,
          total_unique_viewers: analyticsRecord.data.totalUniqueViewers,
          weekly_breakdown: weeklyBreakdown,
          avg_viewers_per_stream: analyticsRecord.data.avgViewersPerStream,
          avg_stream_duration_minutes: analyticsRecord.data.avgStreamDuration,
          date_range: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        });
        
        // Mark as tracked in Mixpanel
        analyticsRecord.trackedInMixpanel = true;
        await analyticsRecord.save();
        
        console.log(`Tracked monthly livestream analytics in Mixpanel for ${monthName} ${year}`);
      } catch (mixpanelError) {
        console.error('Error tracking monthly analytics in Mixpanel:', mixpanelError);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        month: formattedMonth,
        monthName,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        totalLivestreams,
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