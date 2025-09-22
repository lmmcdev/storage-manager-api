# Storage Manager API

An Azure Functions-based API for managing storage operations, built with TypeScript.

## 🚀 Features

- Built with Azure Functions v4
- TypeScript support with ES6+ compilation
- Code formatting with Prettier
- Linting with ESLint and TypeScript rules
- Application Insights integration for monitoring

## 🛠️ Prerequisites

- Node.js 18.x or higher
- Azure Functions Core Tools v4
- Azure subscription (for deployment)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd storage-manager-api
```

2. Install dependencies:
```bash
npm install
```

## 🔧 Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and recompile automatically
- `npm run clean` - Remove the dist directory
- `npm start` - Start the Azure Functions runtime locally
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

### Local Development

1. Start the development server:
```bash
npm start
```

2. The API will be available at `http://localhost:7071`

### Code Quality

This project uses ESLint and Prettier to maintain code quality:

- **ESLint**: Configured with TypeScript rules and Prettier integration
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Strict type checking for better code reliability

## 📁 Project Structure

```
storage-manager-api/
├── src/
│   └── functions/           # Azure Functions
│       └── index.ts        # Main function entry point
├── dist/                   # Compiled JavaScript output
├── .vscode/               # VS Code configuration
├── host.json              # Azure Functions host configuration
├── local.settings.json    # Local development settings
├── tsconfig.json          # TypeScript configuration
├── eslint.config.js       # ESLint configuration
├── .prettierrc            # Prettier configuration
└── package.json           # Project dependencies and scripts
```

## ⚙️ Configuration

### TypeScript Configuration

The project uses TypeScript with the following configuration:
- Target: ES6
- Module: CommonJS
- Source maps enabled
- Output directory: `dist/`

### Azure Functions Configuration

- Runtime version: 2.0
- Extension bundle: Microsoft.Azure.Functions.ExtensionBundle v4.x
- Application Insights integration enabled

## 🚀 Deployment

To deploy to Azure:

1. Make sure you have the Azure CLI installed and are logged in
2. Build the project:
```bash
npm run build
```

3. Deploy using Azure Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

## 📝 Environment Variables

Configure the following environment variables in your `local.settings.json` for local development or in Azure Application Settings for production:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "your-storage-connection-string",
    "FUNCTIONS_WORKER_RUNTIME": "node"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run linting and formatting: `npm run lint:fix && npm run format`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.