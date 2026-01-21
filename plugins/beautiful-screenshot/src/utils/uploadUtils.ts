
export interface UploadResult {
    success: boolean;
    url?: string;
    deleteUrl?: string;
    error?: string;
}

const IMGUR_CLIENT_ID = 'e12815c4905a507'; // Should ideally be in env/settings

export const uploadToImgur = async (dataUrl: string): Promise<UploadResult> => {
    try {
        // Remove header from data URL
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

        const formData = new FormData();
        formData.append('image', base64Data);
        formData.append('type', 'base64');

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                url: data.data.link,
                deleteUrl: data.data.deletehash,
            };
        } else {
            return {
                success: false,
                error: data.data.error?.message || 'Upload failed',
            };
        }
    } catch (error) {
        console.error('Imgur upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown upload error',
        };
    }
};
