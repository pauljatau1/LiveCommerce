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
        mixpanel.track('daily_livestream_analytics', {
          distinct_id: 'system',
          total_livestreams: totalLivestreams,
          assigned_date: formattedDate,
          day_of_week: targetDate.getDay()
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