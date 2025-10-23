const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, this would be stored in a database
let feedbacks = [];
let supportTickets = [];

// Submit feedback
router.post('/', async (req, res) => {
    try {
        const {
            type,
            message,
            rating,
            userId,
            userEmail,
            category = 'general'
        } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const feedback = {
            id: Date.now().toString(),
            type: type || 'feedback',
            message: message.trim(),
            rating: rating || null,
            userId: userId || null,
            userEmail: userEmail || null,
            category,
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        feedbacks.push(feedback);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: feedback.id
        });

    } catch (error) {
        console.error('Feedback submission error:', error.message);
        res.status(500).json({
            error: 'Failed to submit feedback',
            message: error.message
        });
    }
});

// Submit support ticket
router.post('/ticket', async (req, res) => {
    try {
        const {
            subject,
            message,
            priority = 'medium',
            userId,
            userEmail,
            category = 'technical'
        } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                error: 'Subject and message are required'
            });
        }

        const ticket = {
            id: `TICKET-${Date.now()}`,
            subject: subject.trim(),
            message: message.trim(),
            priority,
            userId: userId || null,
            userEmail: userEmail || null,
            category,
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            responses: []
        };

        supportTickets.push(ticket);

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            ticketId: ticket.id
        });

    } catch (error) {
        console.error('Ticket creation error:', error.message);
        res.status(500).json({
            error: 'Failed to create support ticket',
            message: error.message
        });
    }
});

// Get feedback statistics (admin only)
router.get('/stats', async (req, res) => {
    try {
        const totalFeedbacks = feedbacks.length;
        const totalTickets = supportTickets.length;

        const feedbackByCategory = feedbacks.reduce((acc, feedback) => {
            acc[feedback.category] = (acc[feedback.category] || 0) + 1;
            return acc;
        }, {});

        const ticketByStatus = supportTickets.reduce((acc, ticket) => {
            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            return acc;
        }, {});

        const averageRating = feedbacks
            .filter(f => f.rating !== null)
            .reduce((sum, f) => sum + f.rating, 0) /
            feedbacks.filter(f => f.rating !== null).length || 0;

        const recentFeedbacks = feedbacks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        res.json({
            totalFeedbacks,
            totalTickets,
            feedbackByCategory,
            ticketByStatus,
            averageRating: Math.round(averageRating * 10) / 10,
            recentFeedbacks
        });

    } catch (error) {
        console.error('Stats error:', error.message);
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

// Get user feedback history
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'all' } = req.query;

        let userFeedbacks = feedbacks.filter(f => f.userId === userId);
        let userTickets = supportTickets.filter(t => t.userId === userId);

        if (type === 'feedback') {
            userTickets = [];
        } else if (type === 'tickets') {
            userFeedbacks = [];
        }

        res.json({
            feedbacks: userFeedbacks,
            tickets: userTickets
        });

    } catch (error) {
        console.error('User feedback error:', error.message);
        res.status(500).json({
            error: 'Failed to get user feedback',
            message: error.message
        });
    }
});

// Update ticket status (admin only)
router.patch('/ticket/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, response } = req.body;

        const ticket = supportTickets.find(t => t.id === ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        ticket.status = status || ticket.status;
        ticket.updatedAt = new Date().toISOString();

        if (response) {
            ticket.responses.push({
                message: response,
                timestamp: new Date().toISOString(),
                isAdmin: true
            });
        }

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            ticket
        });

    } catch (error) {
        console.error('Ticket update error:', error.message);
        res.status(500).json({
            error: 'Failed to update ticket',
            message: error.message
        });
    }
});

// Get all tickets (admin only)
router.get('/tickets', async (req, res) => {
    try {
        const { status, priority, limit = 50 } = req.query;

        let filteredTickets = supportTickets;

        if (status) {
            filteredTickets = filteredTickets.filter(t => t.status === status);
        }

        if (priority) {
            filteredTickets = filteredTickets.filter(t => t.priority === priority);
        }

        filteredTickets = filteredTickets
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));

        res.json({
            tickets: filteredTickets,
            total: supportTickets.length
        });

    } catch (error) {
        console.error('Tickets error:', error.message);
        res.status(500).json({
            error: 'Failed to get tickets',
            message: error.message
        });
    }
});

// Get feedback by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20 } = req.query;

        const categoryFeedbacks = feedbacks
            .filter(f => f.category === category)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));

        res.json({
            feedbacks: categoryFeedbacks,
            total: feedbacks.filter(f => f.category === category).length
        });

    } catch (error) {
        console.error('Category feedback error:', error.message);
        res.status(500).json({
            error: 'Failed to get category feedback',
            message: error.message
        });
    }
});

module.exports = router;
