/*
    Generates a unique id for each message
*/

// msCrypto is for IE11, which isnt included in ts by default
declare let msCrypto: Crypto;

export function uuidv4() {
    const getRandomValues =
        typeof crypto !== 'undefined' && crypto.getRandomValues ?
            crypto.getRandomValues.bind(crypto) :
            typeof msCrypto !== 'undefined' && msCrypto.getRandomValues ?
                msCrypto.getRandomValues.bind(msCrypto) :
                function () {
                    throw new Error('Your browser does not support crypto.getRandomValues method');
                };

    const buf = new Uint8Array(16);
    getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const bth = [];
    for (let i = 0; i < 256; ++i) {
        bth[i] = (i + 0x100).toString(16).substr(1);
    }

    return (
        bth[buf[0]] +
        bth[buf[1]] +
        bth[buf[2]] +
        bth[buf[3]] +
        '-' +
        bth[buf[4]] +
        bth[buf[5]] +
        '-' +
        bth[buf[6]] +
        bth[buf[7]] +
        '-' +
        bth[buf[8]] +
        bth[buf[9]] +
        '-' +
        bth[buf[10]] +
        bth[buf[11]] +
        bth[buf[12]] +
        bth[buf[13]] +
        bth[buf[14]] +
        bth[buf[15]]
    );
}
