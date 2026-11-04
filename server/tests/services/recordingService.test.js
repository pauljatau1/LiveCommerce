const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mockApi = { post: jest.fn() };
jest.mock('axios', () => ({ create: jest.fn(() => mockApi) }));

const Stream = require('@models/Stream');
const recordingService = require('@/services/recordingService');

const RECORDING_ENV = {
  AGORA_APP_ID: 'app-id',
  AGORA_APP_CERTIFICATE: '0123456789abcdef0123456789abcdef',
  AGORA_CUSTOMER_ID: 'customer',
  AGORA_CUSTOMER_SECRET: 'secret',
  RECORDING_S3_BUCKET: 'shows-bucket',
  RECORDING_S3_REGION: 'eu-west-1',
  RECORDING_S3_ACCESS_KEY: 'access',
  RECORDING_S3_SECRET_KEY: 'secret-key',
};

let mongoServer;
const savedEnv = {};

const createStream = () =>
  Stream.create({
    seller: new mongoose.Types.ObjectId(),
    title: 'Anime figure auction',
    category: 'Collectibles',
    channelName: 'channel-1',
    status: 'live',
  });

describe('recordingService', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    for (const [k, v] of Object.entries(RECORDING_ENV)) {
      savedEnv[k] = process.env[k];
      process.env[k] = v;
    }
    mockApi.post.mockReset();
    await Stream.deleteMany({});
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('is off when any setting is missing or the region is unknown', () => {
    expect(recordingService.isRecordingConfigured()).toBe(true);
    delete process.env.AGORA_CUSTOMER_SECRET;
    expect(recordingService.isRecordingConfigured()).toBe(false);
    process.env.AGORA_CUSTOMER_SECRET = 'secret';
    process.env.RECORDING_S3_REGION = 'mars-north-1';
    expect(recordingService.isRecordingConfigured()).toBe(false);
  });

  it('does nothing and calls no API when not configured', async () => {
    delete process.env.RECORDING_S3_BUCKET;
    const stream = await createStream();
    expect(await recordingService.startRecording(stream)).toBeNull();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('builds a composite S3 request with Agora region codes and the recorder UID', () => {
    const body = recordingService.buildStartBody('channel-1', 'abc123', 'tok');
    expect(body.uid).toBe(recordingService.RECORDER_UID);
    expect(Number(body.uid)).toBeLessThan(100000);
    expect(body.clientRequest.storageConfig).toMatchObject({ vendor: 1, region: 4, bucket: 'shows-bucket' });
    expect(body.clientRequest.recordingFileConfig.avFileType).toEqual(['hls', 'mp4']);
    expect(body.clientRequest.recordingConfig.channelType).toBe(1);
    expect(body.clientRequest.storageConfig.fileNamePrefix).toEqual(['shows', 'abc123']);
  });

  it('starts, saves the session on the stream, then stops and saves the files', async () => {
    const stream = await createStream();
    mockApi.post
      .mockResolvedValueOnce({ data: { resourceId: 'res-1' } })
      .mockResolvedValueOnce({ data: { sid: 'sid-1' } });

    expect(await recordingService.startRecording(stream)).toBe('sid-1');
    expect(mockApi.post.mock.calls[0][0]).toBe('/acquire');
    expect(mockApi.post.mock.calls[1][0]).toBe('/resourceid/res-1/mode/mix/start');
    expect(mockApi.post.mock.calls[1][1].clientRequest.token).toEqual(expect.any(String));

    const recorded = await Stream.findById(stream._id);
    expect(recorded.recording).toMatchObject({ status: 'recording', resourceId: 'res-1', sid: 'sid-1' });

    mockApi.post.mockResolvedValueOnce({
      data: { serverResponse: { fileList: [{ fileName: 'shows/abc/x.mp4', trackType: 'audio_and_video', sliceStartTime: 1 }] } },
    });
    const files = await recordingService.stopRecording(recorded);
    expect(files).toHaveLength(1);
    expect(mockApi.post.mock.calls[2][0]).toBe('/resourceid/res-1/sid/sid-1/mode/mix/stop');

    const stopped = await Stream.findById(stream._id);
    expect(stopped.recording.status).toBe('stopped');
    expect(stopped.recording.files[0].fileName).toBe('shows/abc/x.mp4');
  });

  it('records a failure on the stream instead of throwing', async () => {
    const stream = await createStream();
    mockApi.post.mockRejectedValueOnce(Object.assign(new Error('bad'), { response: { status: 401, data: { message: 'invalid credentials' } } }));

    await expect(recordingService.startRecording(stream)).resolves.toBeNull();
    const failed = await Stream.findById(stream._id);
    expect(failed.recording.status).toBe('failed');
    expect(failed.recording.error).toContain('401');
  });

  it('does not call stop when nothing is recording', async () => {
    const stream = await createStream();
    expect(await recordingService.stopRecording(stream)).toBeNull();
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
