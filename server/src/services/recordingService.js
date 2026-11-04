// Agora cloud recording: records each live show to S3 so it can be cut into clips.
// Off unless every RECORDING_* and AGORA_CUSTOMER_* setting is present.
// Every public function is safe to fire and forget: failures are logged and
// saved on the stream, and never thrown back into the go-live or end flow.
//
// API reference: https://docs.agora.io/en/api-reference/api-ref/cloud-recording/start.md
// S3 region codes: https://docs.agora.io/en/realtime-media/cloud-recording/reference/region-vendor

const axios = require('axios');
const { RtcRole } = require('agora-access-token');
const agoraService = require('./agoraService');
const logger = require('../utils/logger');

const API_BASE = 'https://api.sd-rtn.com';
const MODE = 'mix'; // composite: one mixed file per show

// User UIDs are random in [100000, 4294967295], so a UID below 100000 never collides.
const RECORDER_UID = '90001';

const S3_VENDOR = 1;
// Agora's integer codes for Amazon S3 regions
const S3_REGION_CODES = {
  'us-east-1': 0, 'us-east-2': 1, 'us-west-1': 2, 'us-west-2': 3,
  'eu-west-1': 4, 'eu-west-2': 5, 'eu-west-3': 6, 'eu-central-1': 7,
  'ap-southeast-1': 8, 'ap-southeast-2': 9, 'ap-northeast-1': 10, 'ap-northeast-2': 11,
  'sa-east-1': 12, 'ca-central-1': 13, 'ap-south-1': 14,
  'af-south-1': 18, 'ap-east-1': 19, 'ap-northeast-3': 20, 'eu-north-1': 21,
  'me-south-1': 22, 'ap-southeast-3': 24, 'eu-south-1': 25,
};

const REQUIRED = [
  'AGORA_APP_ID', 'AGORA_APP_CERTIFICATE', 'AGORA_CUSTOMER_ID', 'AGORA_CUSTOMER_SECRET',
  'RECORDING_S3_BUCKET', 'RECORDING_S3_REGION', 'RECORDING_S3_ACCESS_KEY', 'RECORDING_S3_SECRET_KEY',
];

const isRecordingConfigured = () =>
  REQUIRED.every((name) => Boolean(process.env[name])) &&
  S3_REGION_CODES[process.env.RECORDING_S3_REGION] !== undefined;

const client = () => {
  const credential = Buffer.from(
    `${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`
  ).toString('base64');
  return axios.create({
    baseURL: `${API_BASE}/v1/apps/${process.env.AGORA_APP_ID}/cloud_recording`,
    headers: { Authorization: `Basic ${credential}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
};

// Builds the start request body. Exported for tests.
const buildStartBody = (channelName, streamId, token) => ({
  cname: channelName,
  uid: RECORDER_UID,
  clientRequest: {
    token,
    recordingConfig: {
      channelType: 1, // live streaming profile, as used by the host studio
      streamTypes: 2, // audio and video
      maxIdleTime: 300, // keep recording through a host reconnect of up to 5 minutes
      subscribeAudioUids: ['#allstream#'],
      subscribeVideoUids: ['#allstream#'],
      // Portrait, to match phone-shot shows and vertical clips
      transcodingConfig: { width: 720, height: 1280, fps: 24, bitrate: 1500, mixedVideoLayout: 1 },
    },
    recordingFileConfig: { avFileType: ['hls', 'mp4'] },
    storageConfig: {
      vendor: S3_VENDOR,
      region: S3_REGION_CODES[process.env.RECORDING_S3_REGION],
      bucket: process.env.RECORDING_S3_BUCKET,
      accessKey: process.env.RECORDING_S3_ACCESS_KEY,
      secretKey: process.env.RECORDING_S3_SECRET_KEY,
      fileNamePrefix: ['shows', String(streamId)],
    },
  },
});

const saveRecording = async (stream, fields) => {
  const Stream = require('../models/Stream');
  const set = {};
  for (const [key, value] of Object.entries(fields)) set[`recording.${key}`] = value;
  await Stream.updateOne({ _id: stream._id }, { $set: set });
};

const describe = (error) =>
  error.response ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message;

const startRecording = async (stream) => {
  if (!isRecordingConfigured()) return null;
  try {
    const api = client();
    const { data: acquired } = await api.post('/acquire', {
      cname: stream.channelName,
      uid: RECORDER_UID,
      clientRequest: { resourceExpiredHour: 24 },
    });

    // The recorder only watches, and a subscriber token lasts 24 hours,
    // which covers the whole show (Agora cannot refresh a recorder's token).
    const token = agoraService.generateToken(stream.channelName, Number(RECORDER_UID), RtcRole.SUBSCRIBER);
    const { data: started } = await api.post(
      `/resourceid/${acquired.resourceId}/mode/${MODE}/start`,
      buildStartBody(stream.channelName, stream._id, token)
    );

    await saveRecording(stream, {
      status: 'recording',
      resourceId: acquired.resourceId,
      sid: started.sid,
      uid: RECORDER_UID,
      startedAt: new Date(),
      error: null,
    });
    logger.info(`[recording] started for stream ${stream._id} (sid ${started.sid})`);
    return started.sid;
  } catch (error) {
    logger.error(`[recording] start failed for stream ${stream._id}: ${describe(error)}`);
    await saveRecording(stream, { status: 'failed', error: describe(error) }).catch(() => {});
    return null;
  }
};

const stopRecording = async (stream) => {
  const recording = stream.recording || {};
  if (!isRecordingConfigured() || recording.status !== 'recording') return null;
  try {
    const { data } = await client().post(
      `/resourceid/${recording.resourceId}/sid/${recording.sid}/mode/${MODE}/stop`,
      { cname: stream.channelName, uid: recording.uid, clientRequest: {} }
    );
    const files = (data.serverResponse && data.serverResponse.fileList) || [];
    await saveRecording(stream, {
      status: 'stopped',
      stoppedAt: new Date(),
      files: (Array.isArray(files) ? files : []).map((f) => ({
        fileName: f.fileName,
        trackType: f.trackType,
        sliceStartTime: f.sliceStartTime,
      })),
    });
    logger.info(`[recording] stopped for stream ${stream._id}, ${files.length || 0} file(s)`);
    return files;
  } catch (error) {
    logger.error(`[recording] stop failed for stream ${stream._id}: ${describe(error)}`);
    await saveRecording(stream, { status: 'failed', stoppedAt: new Date(), error: describe(error) }).catch(() => {});
    return null;
  }
};

module.exports = {
  isRecordingConfigured,
  startRecording,
  stopRecording,
  buildStartBody,
  RECORDER_UID,
  S3_REGION_CODES,
};
