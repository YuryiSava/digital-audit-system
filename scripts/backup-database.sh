#!/bin/bash
# Database Backup Script for Digital Audit System
# Auto-backup Supabase database with retention policy

# Configuration
BACKUP_DIR="./backups/database"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📅 Date: $(date)"

# Execute backup using Supabase CLI
npx supabase db dump --local > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_FILE"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "💾 Size: $FILE_SIZE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "🗜️  Compressed to: ${BACKUP_FILE}.gz"
    
    # Delete old backups (older than RETENTION_DAYS)
    echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Count remaining backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
    echo "📊 Total backups: $BACKUP_COUNT"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "✨ Backup process completed!"
