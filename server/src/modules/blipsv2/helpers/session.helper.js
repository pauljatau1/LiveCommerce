// In-memory store for seen blips per session (consider Redis for production)
const sessionBlipStore = new Map();

// Maximum number of sessions to prevent memory issues
const MAX_SESSIONS = 1000;
const MAX_SEEN_BLIPS_PER_SESSION = 100;

// Cleanup interval reference for proper cleanup
let cleanupInterval = null;

// Initialize cleanup interval only in production/development, not in tests
if (process.env.NODE_ENV !== 'test') {
  // Clean up old sessions (run periodically)
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    let anonCleaned = 0;
    let authCleaned = 0;
    
    for (const [sessionId, data] of sessionBlipStore.entries()) {
      // Different timeout for anonymous vs authenticated sessions
      // Anonymous: 60 minutes (they browse less frequently)
      // Authenticated: 30 minutes (they have persistent user IDs anyway)
      const timeout = data.isAnonymous ? 60 * 60 * 1000 : 30 * 60 * 1000;
      
      if (now - data.lastAccess > timeout) {
        sessionBlipStore.delete(sessionId);
        cleanedCount++;
        if (data.isAnonymous) {
          anonCleaned++;
        } else {
          authCleaned++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 [SESSION CLEANUP] Cleaned ${cleanedCount} expired sessions (${anonCleaned} anon, ${authCleaned} auth). Active: ${sessionBlipStore.size}`);
    }
  }, 60 * 1000); // Clean every 60 seconds
}

class SessionHelper {
  /**
   * Generates a consistent session ID for tracking seen blips
   * 
   * Priority:
   * 1. Use sessionId from query params (client-side persistence)
   * 2. For authenticated users: use user ID
   * 3. For anonymous users: create fingerprint from IP + User-Agent
   * 
   * @param {Object} req - Express request object
   * @returns {string} Session ID
   */
  generateSessionId(req) {
    // Priority 1: Use sessionId from query params if provided
    if (req.query.sessionId) {
      return req.query.sessionId;
    }
    
    // Priority 2: For authenticated users, use their user ID
    if (req.user?.id) {
      return `user_${req.user.id}_blips`;
    }
    
    // Priority 3: For anonymous users, create a consistent fingerprint
    // This prevents showing the same blips repeatedly to the same anonymous user
    const crypto = require('crypto');
    
    // Get IP address (handle various proxy scenarios)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               'unknown';
    
    // Get User-Agent
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create a fingerprint hash from IP + User-Agent
    // This gives us a consistent session ID for the same anonymous user
    const fingerprint = `${ip}_${userAgent}`;
    const hash = crypto.createHash('md5').update(fingerprint).digest('hex').substring(0, 16);
    
    const sessionId = `anon_${hash}`;
    
    console.log(`🔐 [SESSION DEBUG] Generated anonymous session ID: ${sessionId} (IP: ${ip.substring(0, 10)}...)`);
    
    return sessionId;
  }

  getOrCreateSession(sessionId, page) {
    const isAnonymousSession = sessionId.startsWith('anon_');
    
    // Reset session if user goes back to page 1 (treat as fresh browsing session)
    // BUT: For anonymous users, be less aggressive - only reset if it's been a while
    if (page === 1 && sessionBlipStore.has(sessionId)) {
      const existingSession = sessionBlipStore.get(sessionId);
      const timeSinceLastAccess = Date.now() - existingSession.lastAccess;
      
      // For anonymous users: only reset if they haven't been active for 5 minutes
      // For authenticated users: always reset on page 1 (they can get fresh content)
      const shouldReset = !isAnonymousSession || timeSinceLastAccess > 5 * 60 * 1000;
      
      if (shouldReset) {
        console.log(`🔄 [BLIPS DEBUG] Page 1 requested - resetting session for fresh start (${isAnonymousSession ? 'anon' : 'auth'})`);
        sessionBlipStore.delete(sessionId);
      } else {
        console.log(`⏭️ [BLIPS DEBUG] Page 1 requested for anonymous user, but keeping session (active recently)`);
      }
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
      
      sessionBlipStore.set(sessionId, { 
        seenBlipIds: [], 
        lastAccess: Date.now(), 
        lastPage: 0,
        isAnonymous: isAnonymousSession,
        createdAt: Date.now()
      });
      console.log(`🆕 [BLIPS DEBUG] Created new session for: ${sessionId.substring(0, 30)}... (${isAnonymousSession ? 'anonymous' : 'authenticated'})`);
    } else {
      const existingSession = sessionBlipStore.get(sessionId);
      const sessionAge = Math.floor((Date.now() - existingSession.createdAt) / 1000 / 60); // in minutes
      console.log(`♻️ [BLIPS DEBUG] Using existing session: ${sessionId.substring(0, 30)}... (age: ${sessionAge}m, seen: ${existingSession.seenBlipIds.length} blips)`);
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

    let seenBlipIds = sessionData.seenBlipIds;
    
    // Limit seen blips per session to prevent performance issues
    if (seenBlipIds.length > MAX_SEEN_BLIPS_PER_SESSION) {
      seenBlipIds = seenBlipIds.slice(-MAX_SEEN_BLIPS_PER_SESSION);
      sessionData.seenBlipIds = seenBlipIds;
      console.log(`✂️ [BLIPS DEBUG] Trimmed session to last ${MAX_SEEN_BLIPS_PER_SESSION} seen blips`);
    }

    return { sessionData, seenBlipIds };
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

  /**
   * Get session statistics for monitoring
   * Useful for debugging and understanding session usage
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    let totalSessions = sessionBlipStore.size;
    let anonymousSessions = 0;
    let authenticatedSessions = 0;
    let totalSeenBlips = 0;

    for (const [sessionId, data] of sessionBlipStore.entries()) {
      if (data.isAnonymous) {
        anonymousSessions++;
      } else {
        authenticatedSessions++;
      }
      totalSeenBlips += data.seenBlipIds.length;
    }

    return {
      totalSessions,
      anonymousSessions,
      authenticatedSessions,
      totalSeenBlips,
      averageSeenBlipsPerSession: totalSessions > 0 ? Math.round(totalSeenBlips / totalSessions) : 0
    };
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
