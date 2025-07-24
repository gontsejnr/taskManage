# Task Manager

A modern, efficient task management application designed to help you organize, track, and complete your tasks with ease.

Project Link: https://task-manage-blue.vercel.app/
github link: https://github.com/gontsejnr/taskManage.git

## 🚀 Features

- ✅ Create, read, update, and delete tasks
- 📅 Set deadlines for tasks
- 🎯 Assign priority levels (High, Medium, Low)
- ✔️ Mark tasks as complete/incomplete
- 🎨 Clean, responsive UI with Tailwind CSS
- ⚡ Real-time task sorting by priority and completion status
- 🚨 Visual indicators for overdue tasks

## 🛠️ Technologies Used

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **HTTP Client**: Axios

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/gontsejnr/taskManage.git
   cd taskManage
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables** (if applicable)

   ```bash
   cp .env.example .env
   # Edit .env with your configuration

   # MongoDB Connection
    MONGO_URI=mongodb://localhost:27017/taskmanager

    # Server Configuration
    PORT=5001

   # Client Configuration
    CLIENT_URL=http://localhost:5173
   ```

4. **Initialize the database** (if applicable)
   ```bash
   npm run db:setup
   # or your specific database setup command
   ```

## 🚀 Usage

1. **Start the development server**

   ```bash
   npm start
   # or
   yarn start
   ```

2. **Open your browser** and navigate to `http://localhost:3000` (or your configured port)

3. **Start managing your tasks!**
   - Create new tasks by clicking the "Add Task" button
   - Set priorities and due dates for better organization
   - Mark tasks as complete when finished
   - Use filters to view specific task categories

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style and conventions
- Run linting before submitting: `npm run lint`

## 📝 API Documentation

<!-- If your app has an API, document the main endpoints -->

### Tasks Endpoints

- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Request/Response Examples

```json
// GET /api/tasks
{
  "tasks": [
    {
      "id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive README and API docs",
      "priority": "high",
      "status": "in-progress",
      "dueDate": "2025-08-01",
      "category": "work",
      "createdAt": "2025-07-24T10:00:00Z"
    }
  ]
}
```

## 📦 Build

To create a production build:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` or `build/` directory.

## 🚀 Deployment

### Local Deployment

```bash
npm run build
npm run serve
```

## 🐛 Known Issues

- [ ] Task notifications may not work on older browsers
- [ ] Mobile drag-and-drop needs improvement
- [ ] Large task lists may experience performance issues

## 🚀 Next Steps & Enhancements

- 🔐 Add user authentication and authorization
- 📂 Implement task categories and tags
- 🔔 Add due date notifications and reminders
- 🔍 Create advanced search and filtering capabilities
- 📊 Add task analytics and progress tracking
- 🌙 Implement dark mode toggle
- 📱 Create mobile app version with React Native
- 🔄 Add real-time updates with WebSockets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Gontse Maepa** - [@gontsejnr](https://github.com/gontsejnr)

## 📞 Support

If you have any questions or need help getting started:

- Open an [issue](https://github.com/gontsejnr/taskManage/issues) on GitHub

⭐ If you find this project useful, please consider giving it a star on GitHub!

## 🔄 Changelog

### [1.0.0] - 2025-07-24

- Initial release
- Basic task CRUD operations
- Task prioritization and categorization
- Responsive design implementation

**Happy Task Managing! 🎯**
