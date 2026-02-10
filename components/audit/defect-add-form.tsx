import { useState } from 'react';
import { Button, Input } from '@/components/ui/simple-ui';

interface DefectAddFormProps {
    onSave: (description: string, location: string, videoLink?: string) => void;
    onCancel: () => void;
}

export function DefectAddForm({ onSave, onCancel }: DefectAddFormProps) {
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [videoLink, setVideoLink] = useState('');

    const handleSave = () => {
        if (!description.trim()) return;
        onSave(description, location, videoLink);
    };

    return (
        <div className="bg-slate-900/50 p-3 rounded border border-blue-500/30 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
                <Input
                    placeholder="Описание неисправности..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-8 text-xs bg-black/40"
                    autoFocus
                />
                <Input
                    placeholder="Локация (например, комн. 101)..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8 text-xs bg-black/40"
                />
                <Input
                    placeholder="Ссылка на видео (Google Drive, YouTube)..."
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="h-8 text-xs bg-black/40"
                />
                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Отмена</Button>
                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500" onClick={handleSave}>Сохранить</Button>
                </div>
            </div>
        </div>
    );
}
