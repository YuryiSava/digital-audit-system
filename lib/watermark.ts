/**
 * Utility to add a professional watermark to an image
 */
export async function addWatermarkToImage(
    imageBlob: Blob,
    metadata: {
        dateTime: string;
        location?: string;
        normReference?: string;
        projectTitle?: string;
        auditorName?: string;
    }
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Watermark Styles
            const padding = canvas.width * 0.03;
            const fontSizeShort = Math.max(14, canvas.width * 0.02);
            const fontSizeLong = Math.max(12, canvas.width * 0.015);

            // Draw semi-transparent background for text (bottom area)
            const bgHeight = fontSizeShort * 4.5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, canvas.height - bgHeight, canvas.width, bgHeight);

            // Text Styles
            ctx.fillStyle = 'white';
            ctx.font = `bold ${fontSizeShort}px Arial`;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;

            // 1. Date and Time (Left)
            ctx.fillText(metadata.dateTime, padding, canvas.height - bgHeight + fontSizeShort * 1.5);

            // 2. Normative Reference (Right)
            if (metadata.normReference) {
                ctx.textAlign = 'right';
                ctx.fillText(metadata.normReference, canvas.width - padding, canvas.height - bgHeight + fontSizeShort * 1.5);
            }

            // 3. Location (Left, second line)
            ctx.textAlign = 'left';
            ctx.font = `${fontSizeLong}px Arial`;
            if (metadata.location) {
                ctx.fillText(`GPS: ${metadata.location}`, padding, canvas.height - bgHeight + fontSizeShort * 3);
            }

            // 4. Project/Auditor (Right, second line)
            if (metadata.projectTitle) {
                ctx.textAlign = 'right';
                ctx.fillText(metadata.projectTitle, canvas.width - padding, canvas.height - bgHeight + fontSizeShort * 3);
            }

            // Convert back to blob
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
            }, 'image/jpeg', 0.85);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageBlob);
    });
}
