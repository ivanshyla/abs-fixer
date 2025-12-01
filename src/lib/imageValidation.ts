const DATA_URL_REGEX = /^data:([A-Za-z0-9+\/.-]+);base64,([A-Za-z0-9+/=]+)$/;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export type ValidatedImage = {
    mimeType: string;
    base64: string;
    buffer: Buffer;
    size: number;
};

export const validateImageDataUrl = (
    dataUrl: string,
    label: string,
    maxBytes: number = DEFAULT_MAX_BYTES,
): ValidatedImage => {
    if (!dataUrl || typeof dataUrl !== 'string') {
        throw new Error(`Missing ${label} payload`);
    }

    const matches = dataUrl.trim().match(DATA_URL_REGEX);

    if (!matches) {
        throw new Error(`Invalid ${label} format. Please upload a valid image.`);
    }

    const mimeType = matches[1].toLowerCase();
    const base64 = matches[2];

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error(`Unsupported ${label} type: ${mimeType}`);
    }

    const buffer = Buffer.from(base64, 'base64');
    if (!buffer || buffer.length === 0) {
        throw new Error(`Empty ${label} payload`);
    }

    if (buffer.length > maxBytes) {
        throw new Error(`${label} is too large. Max size is ${Math.floor(maxBytes / (1024 * 1024))}MB.`);
    }

    return {
        mimeType,
        base64,
        buffer,
        size: buffer.length,
    };
};
