# getIngresosBrutos (Playwright Version)

Automated tool to calculate "Ingresos Brutos" tax retentions from Banco Galicia Online Banking.

## Features
- **Modern Stack**: Built with Node.js, TypeScript, and Playwright.
- **Automated Login**: Handles credentials securely via environment variables.

## Prerequisites
- Node.js (v18+)
- Banco Galicia Online Banking Credentials

## Installation
```bash
npm install
```

## Usage

1. Create a `.env` file in the root directory (based on `.env.example`):
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```ini
ING_BRUTOS_DOCUMENTO=YOUR_DNI
ING_BRUTOS_PASSWORD=YOUR_PASSWORD
ING_BRUTOS_USER=YOUR_USERNAME 
ING_BRUTOS_ACCOUNT_NUMBER=YOUR_ACCOUNT_NUMBER 
```

3. Run the script:

**Default behavior** (previous month):
```bash
npm start
```

**Custom date range**:
```bash
npm start -- --from 01/11/2025 --to 30/11/2025
```

**Only specify start date** (will use last day of previous month as end date):
```bash
npm start -- --from 15/11/2025
```

**View help**:
```bash
npm start -- --help
```

### Command Line Options

- `--from <date>`: Start date in DD/MM/YYYY format (default: first day of previous month)
- `--to <date>`: End date in DD/MM/YYYY format (default: last day of previous month)
- `--help, -h`: Show help message

**Note**: When no parameters are specified, the script automatically calculates retentions for the entire previous month (from day 1 to the last day).

## Output
The script will output the list of detected retention transactions and a final summary:

```text
Date Range: 1/11/2025 to 30/11/2025
Summary for 1/11/2025 to 30/11/2025:
Total "Ing. Brutos s/ cred": $87.671,87

>>> TOTAL RETENTIONS (1/11/2025 to 30/11/2025): $87671.87 <<<
```
