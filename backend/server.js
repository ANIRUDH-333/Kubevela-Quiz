import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:G';

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

        // Try to initialize with service account or application default credentials
        let auth;

        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Use service account key file
            auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            // Try application default credentials (useful for Google Cloud deployment)
            try {
                auth = new google.auth.GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            } catch (error) {
                console.log('No Google credentials found. Questions will not be available.');
                return;
            }
        }

        sheets = google.sheets({ version: 'v4', auth });

        // Test the connection by making a simple API call
        await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        isGoogleSheetsConfigured = true;
        console.log('✅ Google Sheets API initialized successfully');
        console.log(`📊 Connected to spreadsheet: ${SPREADSHEET_ID}`);

    } catch (error) {
        console.error('❌ Error initializing Google Sheets API:', error.message);
        console.log('📋 Will require Google Sheets configuration for questions');
        isGoogleSheetsConfigured = false;
    }
}

// Initialize Google Sheets on startup
initializeGoogleSheets();

// Helper function to transform sheet data to quiz questions
function transformSheetDataToQuestions(rows) {
    const questions = [];

    // Skip header row (index 0) if it exists
    const startIndex = rows[0] && rows[0][0] && rows[0][0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];

        // Expected columns: Question, Option1, Option2, Option3, Option4, CorrectAnswer, Difficulty/Weightage
        if (row && row.length >= 6) {
            const options = [
                row[1] ? row[1].toString().trim() : '',
                row[2] ? row[2].toString().trim() : '',
                row[3] ? row[3].toString().trim() : '',
                row[4] ? row[4].toString().trim() : ''
            ].filter(option => option !== ''); // Remove empty options

            // Handle correct answer - could be text or number
            let correctAnswer = 0;
            const correctAnswerValue = row[5] ? row[5].toString().trim() : '';

            if (!isNaN(correctAnswerValue)) {
                // If it's a number, use it directly
                correctAnswer = parseInt(correctAnswerValue);
            } else {
                // If it's text, find the matching option
                correctAnswer = options.findIndex(option =>
                    option.toLowerCase() === correctAnswerValue.toLowerCase()
                );
                if (correctAnswer === -1) correctAnswer = 0; // Default to first option if not found
            }

            // Handle weightage/difficulty
            let weightage = 10; // Default weightage (Medium)
            if (row[6]) {
                const difficultyOrWeightage = row[6].toString().trim().toLowerCase();
                if (!isNaN(difficultyOrWeightage)) {
                    // If it's a number, use it as weightage
                    weightage = parseInt(difficultyOrWeightage);
                } else {
                    // If it's difficulty text, convert to weightage based on new mapping
                    switch (difficultyOrWeightage) {
                        case 'easy':
                            weightage = 5;
                            break;
                        case 'medium':
                            weightage = 10;
                            break;
                        case 'hard':
                            weightage = 20;
                            break;
                        default:
                            console.warn(`Unknown difficulty level: "${difficultyOrWeightage}", using default weightage of 10`);
                            weightage = 10;
                    }
                }
            }

            const question = {
                id: i - startIndex + 1, // Adjust ID based on whether we skipped header
                question: row[0] ? row[0].toString().trim() : '',
                options: options,
                correctAnswer: correctAnswer,
                weightage: weightage
            };

            // Validate the question
            if (question.question && question.options.length >= 2 &&
                question.correctAnswer >= 0 && question.correctAnswer < question.options.length &&
                question.weightage > 0) {
                questions.push(question);
                console.log(`✅ Added question ${question.id}: "${question.question.substring(0, 50)}..." (Answer: ${question.correctAnswer}, Weight: ${question.weightage})`);
            } else {
                console.warn(`❌ Skipping invalid question at row ${i + 1}:`, {
                    question: question.question ? '✓' : '✗',
                    optionsCount: question.options.length,
                    correctAnswer: question.correctAnswer,
                    weightage: question.weightage,
                    originalCorrectAnswer: correctAnswerValue
                });
            }
        }
    }

    console.log(`📝 Transformed ${questions.length} valid questions from Google Sheets`);
    return questions;
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Quiz backend is running',
        googleSheets: isGoogleSheetsConfigured ? 'Connected' : 'Not configured - questions unavailable',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to help troubleshoot Google Sheets issues
app.get('/api/debug', (req, res) => {
    const debug = {
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID ? 'Set' : 'Not set',
            GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE || 'Default: Sheet1!A:G',
            GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Not set'
        },
        googleSheets: {
            configured: isGoogleSheetsConfigured,
            spreadsheetId: SPREADSHEET_ID || 'Not configured',
            range: RANGE
        },
        cache: {
            hasCachedQuestions: cachedQuestions !== null,
            cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null
        },
        fileChecks: {
            envFileExists: fs.existsSync('.env'),
            credentialsFileExists: process.env.GOOGLE_APPLICATION_CREDENTIALS ?
                fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS) : false
        }
    };

    res.json({
        success: true,
        debug: debug,
        timestamp: new Date().toISOString()
    });
});

// Cache for Google Sheets data to avoid excessive API calls
let cachedQuestions = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchQuestionsFromSheets() {
    // Check cache first
    if (cachedQuestions && cacheTimestamp &&
        (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        console.log('📋 Using cached questions');
        return cachedQuestions;
    }

    if (!isGoogleSheetsConfigured) {
        console.log('❌ Google Sheets not configured, no questions available');
        throw new Error('Google Sheets not configured - questions not available');
    }

    try {
        console.log('📊 Fetching fresh data from Google Sheets...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values;
        console.log(`📋 Raw data from Google Sheets:`, {
            totalRows: rows ? rows.length : 0,
            firstRow: rows && rows[0] ? rows[0] : null,
            sampleRow: rows && rows[1] ? rows[1] : null
        });

        if (!rows || rows.length === 0) {
            console.log('❌ No data found in Google Sheets');
            throw new Error('No data found in Google Sheets');
        }

        const questions = transformSheetDataToQuestions(rows);

        if (questions.length === 0) {
            console.log('❌ No valid questions found in Google Sheets');
            console.log('🔍 Check your sheet format - expected columns: Question, Option1, Option2, Option3, Option4, CorrectAnswer, Weightage');
            throw new Error('No valid questions found in Google Sheets');
        }

        // Cache the results
        const result = { questions, source: 'google-sheets' };
        cachedQuestions = result;
        cacheTimestamp = Date.now();

        console.log(`✅ Successfully fetched ${questions.length} questions from Google Sheets`);
        return result;

    } catch (error) {
        console.error('❌ Error fetching from Google Sheets:', error.message);

        // If we have cached data, use it even if expired
        if (cachedQuestions) {
            console.log('📋 Using expired cache due to error');
            return { ...cachedQuestions, source: 'cached-fallback' };
        }

        // No fallback questions available - re-throw the error
        throw error;
    }
}

app.get('/api/questions', async (req, res) => {
    try {
        const result = await fetchQuestionsFromSheets();

        res.json({
            success: true,
            questions: result.questions,
            source: result.source,
            count: result.questions.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in /api/questions:', error);

        // Return error response - no fallback questions available
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questions from Google Sheets',
            error: error.message
        });
    }
});

// Get specific question by ID
app.get('/api/questions/:id', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);

        if (isNaN(questionId) || questionId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid question ID'
            });
        }

        // Get questions using the same caching mechanism
        const result = await fetchQuestionsFromSheets();
        const question = result.questions.find(q => q.id === questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: `Question with ID ${questionId} not found`
            });
        }

        res.json({
            success: true,
            question: question,
            source: result.source
        });

    } catch (error) {
        console.error('❌ Error fetching specific question:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get questions statistics
app.get('/api/questions/stats', async (req, res) => {
    try {
        const result = await fetchQuestionsFromSheets();
        const questions = result.questions;

        const stats = {
            totalQuestions: questions.length,
            totalWeightage: questions.reduce((sum, q) => sum + q.weightage, 0),
            averageWeightage: questions.length > 0 ?
                (questions.reduce((sum, q) => sum + q.weightage, 0) / questions.length).toFixed(2) : 0,
            weightageDistribution: {},
            source: result.source,
            lastUpdated: new Date().toISOString()
        };

        // Calculate weightage distribution
        questions.forEach(q => {
            stats.weightageDistribution[q.weightage] =
                (stats.weightageDistribution[q.weightage] || 0) + 1;
        });

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error getting question stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get question statistics'
        });
    }
});

// Force refresh cache
app.post('/api/questions/refresh', async (req, res) => {
    try {
        // Clear cache
        cachedQuestions = null;
        cacheTimestamp = null;

        // Fetch fresh data
        const result = await fetchQuestionsFromSheets();

        res.json({
            success: true,
            message: 'Cache refreshed successfully',
            questions: result.questions.length,
            source: result.source,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error refreshing cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh cache'
        });
    }
});

// Save user data to Google Sheets
app.post('/api/user-data', async (req, res) => {
    try {
        const { email, name, companyName } = req.body;

        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (isGoogleSheetsConfigured) {
            try {
                // Try to save to Google Sheets
                // Check if user data sheet exists, if not create it or use a different range
                const userDataRange = 'UserData!A:D'; // Assuming UserData sheet exists
                const timestamp = new Date().toISOString();
                
                const values = [[
                    timestamp,
                    email.trim(),
                    name.trim(),
                    companyName ? companyName.trim() : ''
                ]];

                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: userDataRange,
                    valueInputOption: 'RAW',
                    resource: {
                        values: values
                    }
                });

                console.log(`✅ User data saved to Google Sheets: ${email}`);
                
                res.json({
                    success: true,
                    message: 'User data saved successfully',
                    timestamp: timestamp
                });

            } catch (sheetsError) {
                // If specific sheet doesn't exist, try fallback to main sheet with different range
                console.warn('⚠️ UserData sheet not found, trying fallback approach:', sheetsError.message);
                
                try {
                    // Use a different range in the main sheet
                    const fallbackRange = 'Sheet2!A:D'; // Or any other available sheet
                    const timestamp = new Date().toISOString();
                    
                    const values = [[
                        timestamp,
                        email.trim(),
                        name.trim(),
                        companyName ? companyName.trim() : ''
                    ]];

                    await sheets.spreadsheets.values.append({
                        spreadsheetId: SPREADSHEET_ID,
                        range: fallbackRange,
                        valueInputOption: 'RAW',
                        resource: {
                            values: values
                        }
                    });

                    console.log(`✅ User data saved to fallback sheet: ${email}`);
                    
                    res.json({
                        success: true,
                        message: 'User data saved successfully (fallback)',
                        timestamp: timestamp
                    });

                } catch (fallbackError) {
                    console.error('❌ Failed to save to both primary and fallback sheets:', fallbackError.message);
                    
                    // Log the data for manual processing
                    console.log('📝 User data (for manual processing):', {
                        timestamp: new Date().toISOString(),
                        email: email.trim(),
                        name: name.trim(),
                        companyName: companyName ? companyName.trim() : ''
                    });
                    
                    res.json({
                        success: true,
                        message: 'User data received and logged (sheets unavailable)',
                        note: 'Data saved to server logs for manual processing'
                    });
                }
            }
        } else {
            // Google Sheets not configured, log data for manual processing
            const userData = {
                timestamp: new Date().toISOString(),
                email: email.trim(),
                name: name.trim(),
                companyName: companyName ? companyName.trim() : ''
            };
            
            console.log('📝 User data (Google Sheets not configured):', userData);
            
            res.json({
                success: true,
                message: 'User data received and logged',
                note: 'Google Sheets not configured - data saved to server logs'
            });
        }

    } catch (error) {
        console.error('❌ Error saving user data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save user data'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Quiz backend server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Questions API: http://localhost:${PORT}/api/questions`);
    console.log(`📊 Stats API: http://localhost:${PORT}/api/questions/stats`);
    console.log(`🔄 Refresh API: http://localhost:${PORT}/api/questions/refresh`);
    console.log(`👤 User Data API: http://localhost:${PORT}/api/user-data`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);

    // Wait a moment for Google Sheets initialization to complete
    setTimeout(() => {
        if (isGoogleSheetsConfigured) {
            console.log(`📈 Google Sheets: CONFIGURED`);
            console.log(`📝 Spreadsheet ID: ${SPREADSHEET_ID}`);
        } else {
            console.log(`📈 Google Sheets: NOT CONFIGURED - Questions unavailable`);
        }
    }, 1000);
});
