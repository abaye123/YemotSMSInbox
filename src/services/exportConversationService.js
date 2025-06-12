import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Generate filename with timestamp
 */
export function generateFilename(conversation, formatType) {
    const appName = 'סמייל-פרו';
    const contact = conversation.contact;
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: he });
    return `${appName}_שיחה_${contact}_${timestamp}.${formatType}`;
}

/**
 * Export conversation as JSON
 */
export function exportAsJSON(conversation) {
    const exportData = {
        exportInfo: {
            appName: 'סמייל פרו - תצוגת שיחות',
            exportDate: new Date().toISOString(),
            exportFormat: 'JSON',
            version: '1.0'
        },
        conversation: {
            id: conversation.id,
            contact: conversation.contact,
            name: conversation.name,
            avatar: conversation.avatar,
            totalMessages: conversation.messages.length,
            unreadCount: conversation.unreadCount
        },
        messages: conversation.messages.map(message => ({
            id: message.id,
            sender: message.sender,
            content: message.content,
            timestamp: message.timestamp,
            type: message.type,
            status: message.status,
            read: message.read
        })),
        statistics: {
            totalMessages: conversation.messages.length,
            incomingMessages: conversation.messages.filter(m => m.type === 'incoming').length,
            outgoingMessages: conversation.messages.filter(m => m.type === 'outgoing').length,
            unreadMessages: conversation.messages.filter(m => !m.read && m.type === 'incoming').length,
            dateRange: {
                firstMessage: conversation.messages.length > 0 ?
                    conversation.messages[0].timestamp : null,
                lastMessage: conversation.messages.length > 0 ?
                    conversation.messages[conversation.messages.length - 1].timestamp : null
            }
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    downloadFile(dataBlob, generateFilename(conversation, 'json'));
}

function formatMessageTime(timestamp) {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: he });
}

function formatContent(content) {
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

function createMessageHTML(message, conversationName) {
    return `
    <div class="message ${message.type}" data-message-id="${message.id}">
      <div class="message-header">
        <span class="sender">${message.type === 'incoming' ? conversationName : 'אני'}</span>
        <span class="timestamp">${formatMessageTime(message.timestamp)}</span>
        ${message.type === 'outgoing' ? `<span class="status">${message.status === 'DELIVRD' ? '✓✓' : '✓'}</span>` : ''}
        ${message.type === 'incoming' && !message.read ? '<span class="unread-indicator">●</span>' : ''}
      </div>
      <div class="message-content">${formatContent(message.content)}</div>
    </div>
  `;
}

function createHTMLStyles() {
    return `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            direction: rtl;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5em;
        }
        .header .subtitle {
            opacity: 0.9;
            margin-top: 5px;
            font-size: 0.9em;
        }
        .conversation-info {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .conversation-info h2 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .stat-item {
            background: white;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .stat-number {
            font-size: 1.2em;
            font-weight: bold;
            color: #6366f1;
        }
        .messages {
            padding: 20px;
            max-height: 70vh;
            overflow-y: auto;
        }
        .message {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
            position: relative;
        }
        .message.incoming {
            background: #e3f2fd;
            margin-left: 20%;
        }
        .message.outgoing {
            background: #6366f1;
            color: white;
            margin-right: 20%;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 0.85em;
        }
        .sender {
            font-weight: bold;
        }
        .timestamp {
            opacity: 0.7;
        }
        .status {
            font-size: 0.8em;
        }
        .unread-indicator {
            color: #f44336;
            font-weight: bold;
        }
        .message-content {
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .footer {
            background: #f8f9fa;
            padding: 15px 20px;
            text-align: center;
            font-size: 0.85em;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .message.incoming { margin-left: 10%; }
            .message.outgoing { margin-right: 10%; }
            .statistics { grid-template-columns: repeat(2, 1fr); }
        }
  `;
}

/**
 * Export conversation as HTML
 */
export function exportAsHTML(conversation) {
    const messagesHtml = conversation.messages
        .map(message => createMessageHTML(message, conversation.name))
        .join('');

    const statistics = {
        total: conversation.messages.length,
        incoming: conversation.messages.filter(m => m.type === 'incoming').length,
        outgoing: conversation.messages.filter(m => m.type === 'outgoing').length,
        unread: conversation.messages.filter(m => !m.read && m.type === 'incoming').length
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>שיחה עם ${conversation.name}</title>
    <style>${createHTMLStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>שיחה עם ${conversation.name}</h1>
            <div class="subtitle">מספר: ${conversation.contact}</div>
        </div>
        
        <div class="conversation-info">
            <h2>פרטי השיחה</h2>
            <div class="statistics">
                <div class="stat-item">
                    <div class="stat-number">${statistics.total}</div>
                    <div>סה"כ הודעות</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistics.incoming}</div>
                    <div>הודעות נכנסות</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistics.outgoing}</div>
                    <div>הודעות יוצאות</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistics.unread}</div>
                    <div>לא נקראו</div>
                </div>
            </div>
        </div>
        
        <div class="messages">
            ${messagesHtml}
        </div>
        
        <div class="footer">
            יוצא מתוכנת סמייל פרו - תצוגת שיחות<br>
            תאריך ייצוא: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}
        </div>
    </div>
</body>
</html>`;

    const dataBlob = new Blob([htmlContent], { type: 'text/html' });
    downloadFile(dataBlob, generateFilename(conversation, 'html'));
}

function downloadFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

/**
 * Main export function
 */
export function exportConversation(conversation, format) {
    try {
        if (!conversation || !conversation.messages) {
            throw new Error('נתוני שיחה לא תקינים');
        }

        if (format === 'json') {
            exportAsJSON(conversation);
        } else if (format === 'html') {
            exportAsHTML(conversation);
        } else {
            throw new Error('פורמט ייצוא לא נתמך');
        }

    } catch (error) {
        console.error('שגיאה בייצוא השיחה:', error);
        alert('שגיאה בייצוא השיחה: ' + error.message);
    }
}