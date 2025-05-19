function generateStreamLink(streamId,type)
{
    return `https://app.auqli.live/livestream/feed?id=${streamId}&type=${type}&itmSource=share`
}

module.exports = {
    generateStreamLink
}