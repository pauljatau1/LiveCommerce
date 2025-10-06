// In-memory store for seen blips per session (consider Redis for production)
const sessionBlipStore = new Map();

// Maximum number of sessions to prevent memory issues
const MAX_SESSIONS = 1000;

// SMART ROTATION WINDOW CONFIGURATION
// This creates an infinite scroll experience with minimal repetition
// Only the MOST RECENT blips are excluded, older ones rotate back into the feed
const ROTATION_WINDOW_SIZE = 30; // Only exclude last 30 seen blips (adjust based on your needs)
const MAX_SEEN_BLIPS_PER_SESSION = 200; // Keep history for analytics, but only use recent for exclusion

// Cleanup interval reference for proper cleanup
let cleanupInterval = null;

// Initialize cleanup interval only in production/development, not in tests
if (process.env.NODE_ENV !== 'test') {
  // Clean up old sessions (run periodically)
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [sessionId, data] of sessionBlipStore.entries()) {
      if (now - data.lastAccess > 1 * 60 * 1000) { // 1 minute
        sessionBlipStore.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 [BLIPS DEBUG] Cleaned up ${cleanedCount} expired sessions. Active sessions: ${sessionBlipStore.size}`);
    }
  }, 30 * 1000); // Clean every 30 seconds
}

class SessionHelper {
  generateSessionId(req) {
    return req.query.sessionId || 
           (req.user?.id ? `user_${req.user.id}_blips` : `anon_${Math.random().toString(36).substr(2, 9)}`);
  }

  getOrCreateSession(sessionId, page) {
    // Reset session if user goes back to page 1 (treat as fresh browsing session)
    if (page === 1 && sessionBlipStore.has(sessionId)) {
      console.log(`🔄 [BLIPS DEBUG] Page 1 requested - resetting session for fresh start`);
      sessionBlipStore.delete(sessionId);
    }

    // Get or initialize seen blips for this session
    if (!sessionBlipStore.has(sessionId)) {
      // Check if we're at session limit to prevent memory issues
      if (sessionBlipStore.size >= MAX_SESSIONS) {
        console.log(`⚠️ [BLIPS DEBUG] Session limit reached (${MAX_SESSIONS}), forcing cleanup`);
        // Remove oldest sessions
        const sortedSessions = Array.from(sessionBlipStore.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const sessionsToRemove = sortedSessions.slice(0, Math.floor(MAX_SESSIONS * 0.2));
        sessionsToRemove.forEach(([id]) => sessionBlipStore.delete(id));
        console.log(`🧹 [BLIPS DEBUG] Removed ${sessionsToRemove.length} oldest sessions`);
      }
      
      sessionBlipStore.set(sessionId, { seenBlipIds: [], lastAccess: Date.now(), lastPage: 0 });
      console.log(`🆕 [BLIPS DEBUG] Created new session for: ${sessionId}`);
    } else {
      console.log(`♻️ [BLIPS DEBUG] Using existing session: ${sessionId}`);
    }
    
    const sessionData = sessionBlipStore.get(sessionId);
    sessionData.lastAccess = Date.now();
    
    // Check if user is going backwards (lower page than before) - reset session for better UX
    if (sessionData.lastPage && page < sessionData.lastPage) {
      console.log(`⬅️ [BLIPS DEBUG] Backward navigation detected: Page ${sessionData.lastPage} → Page ${page}. Resetting session.`);
      sessionData.seenBlipIds = [];
      sessionData.lastPage = page;
    } else {
      // Update last page for forward navigation
      sessionData.lastPage = Math.max(sessionData.lastPage || 0, page);
    }

    // Get all seen blips for this session
    let allSeenBlipIds = sessionData.seenBlipIds;
    
    // Limit total history per session to prevent memory issues
    if (allSeenBlipIds.length > MAX_SEEN_BLIPS_PER_SESSION) {
      allSeenBlipIds = allSeenBlipIds.slice(-MAX_SEEN_BLIPS_PER_SESSION);
      sessionData.seenBlipIds = allSeenBlipIds;
      console.log(`✂️ [BLIPS DEBUG] Trimmed session to last ${MAX_SEEN_BLIPS_PER_SESSION} seen blips`);
    }

    // SMART ROTATION WINDOW: Only exclude the MOST RECENT blips
    // This creates infinite scroll - older blips rotate back into the feed
    const recentlySeenBlipIds = allSeenBlipIds.slice(-ROTATION_WINDOW_SIZE);
    
    if (allSeenBlipIds.length > ROTATION_WINDOW_SIZE) {
      console.log(`🔄 [BLIPS DEBUG] Rotation Window: Excluding only last ${ROTATION_WINDOW_SIZE} of ${allSeenBlipIds.length} total seen blips`);
      console.log(`♻️ [BLIPS DEBUG] ${allSeenBlipIds.length - ROTATION_WINDOW_SIZE} older blips can now rotate back into feed`);
    }

    // Return recently seen IDs for exclusion (creates rotation)
    return { sessionData, seenBlipIds: recentlySeenBlipIds, allSeenBlipIds };
  }

  updateSessionWithNewBlips(sessionData, newlySeenBlipIds, page) {
    // Add the newly seen blip IDs to the session
    sessionData.seenBlipIds = [...sessionData.seenBlipIds, ...newlySeenBlipIds];
    sessionData.lastPage = page; // Update the last page accessed
    console.log(`✅ [BLIPS DEBUG] Session now has ${sessionData.seenBlipIds.length} total seen blips`);
  }

  validateAndCleanObjectIds(seenBlipIds) {
    const mongoose = require('mongoose');
    const seenBlipObjectIds = seenBlipIds.length > 0 ? seenBlipIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.log(`⚠️ [BLIPS DEBUG] Invalid ObjectId: ${id} - removing from session`);
        return null;
      }
    }).filter(id => id !== null) : [];

    // If we had invalid ObjectIds, clean them from the session
    if (seenBlipObjectIds.length < seenBlipIds.length) {
      const validIds = seenBlipObjectIds.map(id => id.toString());
      console.log(`🧹 [BLIPS DEBUG] Cleaned invalid ObjectIds from session`);
      return { seenBlipObjectIds, validIds };
    }

    return { seenBlipObjectIds, validIds: seenBlipIds };
  }
}

// Cleanup function for tests
function cleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  sessionBlipStore.clear();
}

module.exports = new SessionHelper();
module.exports.cleanup = cleanup;
