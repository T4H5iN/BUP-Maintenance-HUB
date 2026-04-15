# BUP Maintenance HUB

## Overview

**BUP Maintenance HUB** is a centralized platform designed to streamline maintenance operations, simplify work order processing, and facilitate proactive facility management for BUP (Bangladesh University of Professionals). The application aims to enhance visibility, accountability, and overall efficiency in maintaining university assets and infrastructure.

## Features

- **Service Request Submission**: Easily log and track maintenance requests through a user-friendly interface.
- **Work Order Management**: Assign, prioritize, and monitor work orders in real time.
- **Asset Tracking**: Maintain records of assets, scheduled maintenance, and maintenance history.
- **Notifications & Alerts**: Keep all stakeholders informed with email and in-app notifications.
- **Reporting & Analytics**: Generate insights and export reports for operational improvement.
- **User Roles & Permissions**: Fine-grained access controls for staff, supervisors, and administrators.

## Screenshots

See screenshots of the project [here](https://mdti.pro.bd/#projects)

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com)
- [Brevo API](https://www.brevo.com/)
- [Cloudinary API](https://cloudinary.com/)
- [GEMINI API](https://aistudio.google.com/api-keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/T4H5iN/BUP-Maintenance-HUB.git
   cd BUP-Maintenance-HUB
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
    ```bash
    PORT=
    MONGODB_URI=
    EMAIL_FROM=
    BREVO_API_KEY=
    GEMINI_API_KEY=
    GEMINI_MODEL=
    GEMINI_MAX_TOKENS=
    GEMINI_TEMPERATURE=
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    ```

4. **Start the application**
   ```bash
   node server.js
   ```

## License

This project is licensed under the [MIT License](LICENSE).
