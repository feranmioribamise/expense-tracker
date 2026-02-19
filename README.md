# SpendSmart - AI Expense Tracker

**Deployed Application:** [Coming Soon]

**GitHub Repository:** https://github.com/feranmioribamis/expense-tracker

---

## Overview

SpendSmart is an intelligent expense tracking application that uses artificial intelligence to automatically categorize your spending and help you manage your budget. Track expenses, analyze spending patterns, and stay on top of your finances with real-time insights and AI-powered features.

---

## Key Features

### AI Auto-Categorization
Upload a receipt or manually enter an expense, and GPT-4 automatically categorizes it into the right spending category (Food & Dining, Transportation, Shopping, etc.). No manual tagging required.

### Receipt Scanner
Take a photo of your receipt and AI instantly extracts the amount and merchant name. The expense is automatically added to your tracker with minimal effort.

### Interactive Dashboard
The dashboard provides a comprehensive view of your spending with several key visualizations:
- Spending summary showing total expenses, transaction count, and average per transaction
- Category breakdown with a pie chart showing where your money goes
- Six-month trend line displaying spending patterns over time
- Budget tracker with real-time progress and visual alerts

### Monthly Budget Management
Set a monthly spending limit and track your progress in real-time. The system provides visual alerts when you've used 80%, 90%, or 100% of your budget, helping you stay aware of your spending throughout the month.

### Full Expense Management
The application supports complete expense management with the following capabilities:
- Add expenses manually or via receipt scan
- Edit any expense with a single click
- Delete expenses you no longer need
- Search and filter by category, keyword, or date
- Export all expenses to CSV for external analysis or tax purposes

### Smart Categories
The system automatically sorts expenses into nine common categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Education, and Other. You can override the AI's categorization if needed.

### Secure Authentication
User accounts are protected with JWT-based authentication and industry-standard password hashing, keeping your financial data private and secure.

---

## How to Use

### Getting Started
Create an account with your name, email, and password. Once registered, log in to access your personal expense dashboard.

### Adding Expenses

**Scanning a Receipt**
1. Click the "Add Expense" button
2. Click "Upload" under the receipt scanner section
3. Take or upload a photo of your receipt
4. The AI will extract the amount and merchant name automatically
5. Review the extracted information and save

**Manual Entry**
1. Click "Add Expense"
2. Enter a description (for example, "Starbucks coffee")
3. Enter the amount
4. Select the date
5. Either let the AI categorize it automatically or select a category manually
6. Save the expense

### Managing Your Budget
Navigate to the Dashboard and locate the Monthly Budget card. Click "Edit" to set your monthly spending limit. The system will then track your progress with a visual progress bar and provide warnings as you approach your limit.

### Viewing Reports
The Dashboard shows your current month overview including total spending, transaction count, and average spending per transaction. The pie chart displays your spending distribution by category, while the bar chart shows your six-month spending trend. The budget tracker displays your remaining budget and provides visual warnings.

### Exporting Data
Go to the Expenses page and click the "Export CSV" button. The file downloads automatically and can be used in Excel, Google Sheets, or tax preparation software.

### Managing Your Account
Click the avatar circle with your initials in the top right corner to access settings. From there you can update your profile information, change your password, or log out of the application.

---

## Why SpendSmart?

### The Problem
Tracking expenses manually is tedious and time-consuming. Most people forget to log purchases, spend unnecessary time categorizing each transaction, lose track of their budget, and have no clear picture of their spending patterns.

### The Solution
SpendSmart automates the repetitive aspects of expense tracking. The AI categorization eliminates manual tagging, receipt scanning removes data entry, real-time budget tracking helps prevent overspending, and visual dashboards make spending patterns immediately obvious.

### Who It's For
SpendSmart is designed for individuals tracking personal finances, households managing shared budgets, freelancers tracking business expenses, and anyone wanting to understand their spending habits better.

---

## Technology Stack

Built with React and TypeScript on the frontend, Node.js and Express on the backend, PostgreSQL for data storage, OpenAI GPT-4 and GPT-4 Vision for AI capabilities, and JWT with bcrypt for secure authentication.

---

## Privacy and Security

All expense data is stored securely in a PostgreSQL database. Passwords are hashed using industry-standard bcrypt encryption. JWT tokens expire after seven days for security purposes. Each user can only access their own expense data. Receipt images are processed by AI for data extraction but are not permanently stored on our servers.

---

## Future Enhancements

Planned features include mobile applications for iOS and Android, recurring expense tracking, the ability to split expenses with others, direct bank account integration, comprehensive tax reporting features, and multi-currency support for international users.

---

## Support

For questions or issues, contact: [your-email@example.com]

---

## License

MIT License - See LICENSE file for details