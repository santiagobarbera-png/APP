class Message {
    constructor(id, senderId, receiverId, content, timestamp, isRead = false) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = timestamp;
        this.isRead = isRead;
    }

    save() {
        // Code to save the message to the database
        console.log('Message saved:', this);
    }

    static findById(id) {
        // Code to find a message by its ID
        console.log('Finding message by ID:', id);
    }

    static findConversation(userId1, userId2) {
        // Code to find a conversation between two users
        console.log('Finding conversation between:', userId1, 'and', userId2);
    }

    markAsRead() {
        this.isRead = true;
        // Code to update the message status in the database
        console.log('Message marked as read:', this.id);
    }

    static delete(id) {
        // Code to delete a message by its ID
        console.log('Message deleted with ID:', id);
    }
}

module.exports = Message;