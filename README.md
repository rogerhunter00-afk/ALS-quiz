# ALS Quiz

## Configuration

Sensitive Google Script URLs are now kept on the server instead of the browser.

1. Copy `.env.example` to `.env` and fill in your real URLs.
   - `WEB_APP_URL` – Apps Script endpoint for saving results.
   - `QUIZ_LIST_URL` – Apps Script endpoint used to fetch available quizzes.
   - `QUESTIONS_URL` – Apps Script endpoint used for quiz questions.
   - `SHEET_URL` – direct link to the Google Sheet.
2. Start the local server:

```bash
node server.js
```

The front end now talks only to relative paths:

- `/api/webapp` – save results and connectivity test.
- `/api/quizzes` – list available quizzes.
- `/api/questions` – fetch or add quiz questions.
- `/sheet` – redirect to the configured sheet.

Ensure these environment variables are set wherever the app is deployed.
