import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:G';
const USER_DATA_RANGE = process.env.GOOGLE_SHEETS_USER_DATA_RANGE || 'UserData!A:H';

// Initialize Google Sheets API
let sheets;
let isGoogleSheetsConfigured = false;

async function initializeGoogleSheets() {
    try {
        // Check if we have the required environment variables
        if (!SPREADSHEET_ID || SPREADSHEET_ID === 'your_spreadsheet_id_here') {
            console.log('Google Sheets not configured - SPREADSHEET_ID missing or default value');
            return;
        }

        // For Vercel deployment, we'll use service account credentials from environment variables
        let auth;

        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            // Parse the service account key from environment variable
            const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            auth = new google.auth.GoogleAuth({
                credentials: serviceAccountKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Use service account key file (for local development)
            auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            console.log('No Google credentials found. Questions will not be available.');
            return;
        }

        sheets = google.sheets({ version: 'v4', auth });

        // Test the connection by making a simple API call
        await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        isGoogleSheetsConfigured = true;
        console.log('✅ Google Sheets API initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing Google Sheets API:', error.message);
        console.log('📋 Will require Google Sheets configuration for questions');
        isGoogleSheetsConfigured = false;
    }
}

// Helper function to transform sheet data to quiz questions
function transformSheetDataToQuestions(rows) {
    const questions = [];
    const startIndex = rows[0] && rows[0][0] && rows[0][0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];

        if (row && row.length >= 6) {
            const options = [
                row[1] ? row[1].toString().trim() : '',
                row[2] ? row[2].toString().trim() : '',
                row[3] ? row[3].toString().trim() : '',
                row[4] ? row[4].toString().trim() : ''
            ].filter(option => option !== '');

            let correctAnswer = 0;
            const correctAnswerValue = row[5] ? row[5].toString().trim() : '';

            if (!isNaN(correctAnswerValue)) {
                correctAnswer = parseInt(correctAnswerValue);
            } else {
                correctAnswer = options.findIndex(option =>
                    option.toLowerCase() === correctAnswerValue.toLowerCase()
                );
                if (correctAnswer === -1) correctAnswer = 0;
            }

            let weightage = 10;
            if (row[6]) {
                const difficultyOrWeightage = row[6].toString().trim().toLowerCase();
                if (!isNaN(difficultyOrWeightage)) {
                    weightage = parseInt(difficultyOrWeightage);
                } else {
                    switch (difficultyOrWeightage) {
                        case 'easy': weightage = 5; break;
                        case 'medium': weightage = 10; break;
                        case 'hard': weightage = 20; break;
                        default: weightage = 10;
                    }
                }
            }

            const question = {
                id: i - startIndex + 1,
                question: row[0] ? row[0].toString().trim() : '',
                options: options,
                correctAnswer: correctAnswer,
                weightage: weightage
            };

            if (question.question && question.options.length >= 2 &&
                question.correctAnswer >= 0 && question.correctAnswer < question.options.length &&
                question.weightage > 0) {
                questions.push(question);
            }
        }
    }

    return questions;
}

// No fallback questions - all questions sourced from Google Sheets

let questionsCache = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getQuestions() {
    const now = Date.now();

    if (questionsCache.length > 0 && (now - lastCacheUpdate) < CACHE_DURATION) {
        return questionsCache;
    }

    if (!isGoogleSheetsConfigured) {
        await initializeGoogleSheets();
    }

    if (isGoogleSheetsConfigured) {
        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGE,
            });

            const rows = response.data.values;
            if (rows && rows.length > 0) {
                questionsCache = transformSheetDataToQuestions(rows);
                lastCacheUpdate = now;
                return questionsCache;
            }
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
        }
    }

    // No fallback questions available - throw error
    throw new Error('Google Sheets not configured and no cached questions available');
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        googleSheetsConfigured: isGoogleSheetsConfigured
    });
});

app.get('/api/questions', async (req, res) => {
    try {
        const questions = await getQuestions();

        const count = parseInt(req.query.count) || questions.length;
        const selectedQuestions = questions.slice(0, Math.min(count, questions.length));

        res.json({
            success: true,
            questions: selectedQuestions,
            total: questions.length,
            source: isGoogleSheetsConfigured ? 'Google Sheets' : 'Error: No source available'
        });
    } catch (error) {
        console.error('Error in /api/questions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions',
            message: error.message
        });
    }
});

app.get('/api/questions/:id', async (req, res) => {
    try {
        const questions = await getQuestions();
        const questionId = parseInt(req.params.id);
        const question = questions.find(q => q.id === questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        res.json({
            success: true,
            question: question
        });
    } catch (error) {
        console.error('Error in /api/questions/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch question',
            message: error.message
        });
    }
});

app.get('/api/questions/stats', async (req, res) => {
    try {
        const questions = await getQuestions();

        const stats = {
            success: true,
            total: questions.length,
            byWeightage: {
                easy: questions.filter(q => q.weightage === 5).length,
                medium: questions.filter(q => q.weightage === 10).length,
                hard: questions.filter(q => q.weightage === 20).length
            },
            source: isGoogleSheetsConfigured ? 'Google Sheets' : 'Error: No source available',
            lastUpdated: new Date(lastCacheUpdate).toISOString()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error in /api/questions/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

app.post('/api/questions/refresh', async (req, res) => {
    try {
        questionsCache = [];
        lastCacheUpdate = 0;

        const questions = await getQuestions();

        res.json({
            success: true,
            message: 'Questions cache refreshed',
            count: questions.length,
            source: isGoogleSheetsConfigured ? 'Google Sheets' : 'Error: No source available'
        });
    } catch (error) {
        console.error('Error in /api/questions/refresh:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh questions',
            message: error.message
        });
    }
});

app.post('/api/user-data', async (req, res) => {
    try {
        const userData = req.body;
        console.log('Received user data:', userData);

        if (!isGoogleSheetsConfigured) {
            await initializeGoogleSheets();
        }

        if (isGoogleSheetsConfigured) {
            try {
                // Prepare user data row for sheets
                const timestamp = new Date().toISOString();
                const row = [
                    timestamp,
                    userData.name || '',
                    userData.email || '',
                    userData.score || 0,
                    userData.totalQuestions || 0,
                    userData.correctAnswers || 0,
                    userData.percentage || 0,
                    JSON.stringify(userData.answers || {})
                ];

                // Append to Google Sheets
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: USER_DATA_RANGE,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    resource: {
                        values: [row]
                    }
                });

                console.log('✅ User data saved to Google Sheets successfully');

                res.json({
                    success: true,
                    message: 'User data saved to Google Sheets successfully',
                    timestamp: timestamp
                });
            } catch (sheetsError) {
                console.error('❌ Error saving to Google Sheets:', sheetsError);
                
                // Fallback: still return success but log the error
                res.json({
                    success: true,
                    message: 'User data received (Google Sheets save failed)',
                    timestamp: new Date().toISOString(),
                    warning: 'Data was not saved to Google Sheets'
                });
            }
        } else {
            // Google Sheets not configured - just log and return success
            console.log('⚠️ Google Sheets not configured - user data only logged');
            
            res.json({
                success: true,
                message: 'User data received (Google Sheets not configured)',
                timestamp: new Date().toISOString(),
                warning: 'Data was not saved to Google Sheets'
            });
        }
    } catch (error) {
        console.error('Error in /api/user-data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save user data',
            message: error.message
        });
    }
});

// Export the Express app as a serverless function
export default app;
