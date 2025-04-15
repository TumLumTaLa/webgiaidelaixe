// server.js - Express server setup
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const session = require('express-session');
const authRoutes = require('./routes/auth');
const isAuthenticated = require('./middleware/auth');

app.use(session({
    secret: 'driving-license-secret',
    resave: false,
    saveUninitialized: false
}));

app.use('/api/auth', authRoutes);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/driving_exam', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    timeLimit: { type: Number, default: 30 }, // Time limit in minutes
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const QuestionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    question: { type: String, required: true },
    answer: { type: Boolean, required: true },
    explanation: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', ExamSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Routes for exams
app.get('/api/exams', async (req, res) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/exams', isAuthenticated,, async (req, res) => {
    try {
        const newExam = new Exam({
            title: req.body.title,
            description: req.body.description,
            timeLimit: req.body.timeLimit || 30
        });
        const savedExam = await newExam.save();
        res.status(201).json(savedExam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/exams/:id', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/exams/:id', isAuthenticated,, async (req, res) => {
    try {
        const updatedExam = await Exam.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true }
        );
        if (!updatedExam) return res.status(404).json({ message: 'Exam not found' });
        res.json(updatedExam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/exams/:id', isAuthenticated,, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        // Delete all questions associated with this exam
        await Question.deleteMany({ examId: req.params.id });
        
        // Delete the exam
        await Exam.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Routes for questions
app.get('/api/exams/:examId/questions', async (req, res) => {
    try {
        const questions = await Question.find({ examId: req.params.examId });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/exams/:examId/questions', isAuthenticated,, async (req, res) => {
    try {
        // Verify exam exists
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        // Create question
        const newQuestion = new Question({
            examId: req.params.examId,
            question: req.body.question,
            answer: req.body.answer,
            explanation: req.body.explanation
        });
        
        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Bulk add questions to an exam
app.post('/api/exams/:examId/questions/bulk', isAuthenticated,, async (req, res) => {
    try {
        // Verify exam exists
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        // Check if questions array is provided
        if (!Array.isArray(req.body.questions) || req.body.questions.length === 0) {
            return res.status(400).json({ message: 'Questions array is required' });
        }
        
        // Prepare questions for bulk insert
        const questionsToInsert = req.body.questions.map(q => ({
            examId: req.params.examId,
            question: q.question,
            answer: q.answer,
            explanation: q.explanation
        }));
        
        // Insert questions
        const insertedQuestions = await Question.insertMany(questionsToInsert);
        res.status(201).json(insertedQuestions);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/questions/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json(question);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/questions/:id', isAuthenticated,, async (req, res) => {
    try {
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true }
        );
        if (!updatedQuestion) return res.status(404).json({ message: 'Question not found' });
        res.json(updatedQuestion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/questions/:id', isAuthenticated,, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
