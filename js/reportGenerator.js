/**
 * Report Generator - Handles PDF generation for administrative reports
 */

class ReportGenerator {
    constructor() {
        // Initialize properties
        this.pdfDoc = null;
        this.pageWidth = 0;
        this.pageMargin = 15;
        this.currentY = 0;
        this.colorPalette = {
            primary: [30, 58, 138],
            secondary: [59, 130, 246],
            success: [16, 185, 129],
            warning: [245, 158, 11],
            danger: [239, 68, 68],
            dark: [31, 41, 55],
            gray: [156, 163, 175]
        };
    }

    /**
     * Generate a PDF report from the provided data
     * @param {Object} reportData - The report data to generate PDF from
     * @returns {jsPDF} - The generated PDF document
     */
    generatePDF(reportData) {
        try {
            // Create new PDF document
            this.pdfDoc = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Set basic properties
            this.pageWidth = this.pdfDoc.internal.pageSize.width;
            this.currentY = this.pageMargin;
            
            // Generate the PDF content
            this.addReportHeader(reportData);
            this.addSummarySection(reportData);
            this.addCategorySection(reportData);
            this.addPrioritySection(reportData);
            this.addTechnicianSection(reportData);
            
            // Add footer with pagination
            const pageCount = this.pdfDoc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                this.pdfDoc.setPage(i);
                this.addFooter(i, pageCount, reportData.reportDate);
            }
            
            return this.pdfDoc;
        } catch (error) {
            console.error("Error generating PDF:", error);
            showNotification("Error generating PDF report", "error");
            return null;
        }
    }
    
    /**
     * Add report header section to PDF
     */
    addReportHeader(reportData) {
        // Set font for header
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(this.colorPalette.primary[0], this.colorPalette.primary[1], this.colorPalette.primary[2]);
        this.pdfDoc.setFontSize(22);
        
        // Add header text
        this.pdfDoc.text("BUP Maintenance HUB", this.pageWidth / 2, this.currentY, { align: "center" });
        this.currentY += 10;
        
        this.pdfDoc.setFontSize(18);
        this.pdfDoc.text("Administrative Report", this.pageWidth / 2, this.currentY, { align: "center" });
        this.currentY += 8;
        
        // Add report date
        this.pdfDoc.setFont("helvetica", "normal");
        this.pdfDoc.setTextColor(this.colorPalette.gray[0], this.colorPalette.gray[1], this.colorPalette.gray[2]);
        this.pdfDoc.setFontSize(12);
        this.pdfDoc.text(`Generated on: ${reportData.reportDate}`, this.pageWidth / 2, this.currentY, { align: "center" });
        this.currentY += 15;
        
        // Add horizontal separator
        this.pdfDoc.setDrawColor(200, 200, 200);
        this.pdfDoc.line(this.pageMargin, this.currentY, this.pageWidth - this.pageMargin, this.currentY);
        this.currentY += 10;
    }
    
    /**
     * Add summary statistics section to PDF
     */
    addSummarySection(reportData) {
        // Section header
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(this.colorPalette.dark[0], this.colorPalette.dark[1], this.colorPalette.dark[2]);
        this.pdfDoc.setFontSize(16);
        this.pdfDoc.text("Executive Summary", this.pageMargin, this.currentY);
        this.currentY += 10;
        
        // Create summary data grid
        const summaryData = [
            [
                { text: "Total Issues", style: "header" },
                { text: "Resolved Issues", style: "header" },
                { text: "Pending Issues", style: "header" },
                { text: "Resolution Rate", style: "header" }
            ],
            [
                { text: reportData.totalIssues.toString(), style: "value" },
                { text: reportData.resolvedIssues.toString(), style: "value" },
                { text: reportData.pendingIssues.toString(), style: "value" },
                { text: `${reportData.resolutionRate}%`, style: "value" }
            ]
        ];
        
        // Calculate grid layout
        const colWidth = (this.pageWidth - (this.pageMargin * 2)) / 4;
        
        // Draw summary grid
        this.pdfDoc.setDrawColor(230, 230, 230);
        this.pdfDoc.setFillColor(248, 250, 252);
        
        // Draw background for header row
        this.pdfDoc.setFillColor(240, 240, 240);
        this.pdfDoc.rect(this.pageMargin, this.currentY, this.pageWidth - (this.pageMargin * 2), 10, 'F');
        
        // Draw grid borders
        for (let i = 0; i <= 4; i++) {
            const x = this.pageMargin + (i * colWidth);
            this.pdfDoc.line(x, this.currentY, x, this.currentY + 20);
        }
        this.pdfDoc.line(this.pageMargin, this.currentY, this.pageWidth - this.pageMargin, this.currentY);
        this.pdfDoc.line(this.pageMargin, this.currentY + 10, this.pageWidth - this.pageMargin, this.currentY + 10);
        this.pdfDoc.line(this.pageMargin, this.currentY + 20, this.pageWidth - this.pageMargin, this.currentY + 20);
        
        // Draw header row text
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(60, 60, 60);
        this.pdfDoc.setFontSize(11);
        for (let i = 0; i < 4; i++) {
            this.pdfDoc.text(
                summaryData[0][i].text,
                this.pageMargin + (i * colWidth) + (colWidth / 2),
                this.currentY + 6,
                { align: "center" }
            );
        }
        
        // Draw value row text
        this.pdfDoc.setFont("helvetica", "normal");
        this.pdfDoc.setTextColor(30, 30, 30);
        this.pdfDoc.setFontSize(14);
        for (let i = 0; i < 4; i++) {
            this.pdfDoc.text(
                summaryData[1][i].text,
                this.pageMargin + (i * colWidth) + (colWidth / 2),
                this.currentY + 16,
                { align: "center" }
            );
        }
        
        this.currentY += 25;
    }
    
    /**
     * Add category distribution section to PDF
     */
    addCategorySection(reportData) {
        // Check if we need to add a new page
        if (this.currentY > 230) {
            this.pdfDoc.addPage();
            this.currentY = this.pageMargin;
        }
        
        // Section header
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(this.colorPalette.dark[0], this.colorPalette.dark[1], this.colorPalette.dark[2]);
        this.pdfDoc.setFontSize(16);
        this.pdfDoc.text("Issue Category Distribution", this.pageMargin, this.currentY);
        this.currentY += 8;
        
        // Prepare table data
        const tableHead = [['Category', 'Count', 'Percentage']];
        const tableBody = Object.entries(reportData.categoryCounts).map(([category, count]) => {
            const percentage = Math.round((count / reportData.totalIssues) * 100);
            return [this.formatCategoryName(category), count.toString(), `${percentage}%`];
        });
        
        // Sort by count descending
        tableBody.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
        
        // Add table
        this.pdfDoc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: this.currentY,
            margin: { left: this.pageMargin, right: this.pageMargin },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 40, halign: 'center' }
            }
        });
        
        this.currentY = this.pdfDoc.lastAutoTable.finalY + 10;
    }
    
    /**
     * Add priority distribution section to PDF
     */
    addPrioritySection(reportData) {
        // Check if we need to add a new page
        if (this.currentY > 200) {
            this.pdfDoc.addPage();
            this.currentY = this.pageMargin;
        }
        
        // Section header
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(this.colorPalette.dark[0], this.colorPalette.dark[1], this.colorPalette.dark[2]);
        this.pdfDoc.setFontSize(16);
        this.pdfDoc.text("Priority Distribution", this.pageMargin, this.currentY);
        this.currentY += 8;
        
        // Prepare table data
        const tableHead = [['Priority', 'Count', 'Percentage']];
        const priorityOrder = ['urgent', 'high', 'medium', 'low'];
        const tableBody = priorityOrder.map(priority => {
            const count = reportData.priorityCounts[priority] || 0;
            const percentage = reportData.totalIssues > 0 
                ? Math.round((count / reportData.totalIssues) * 100) 
                : 0;
            return [
                this.formatPriorityName(priority), 
                count.toString(), 
                `${percentage}%`
            ];
        });
        
        // Add table
        this.pdfDoc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: this.currentY,
            margin: { left: this.pageMargin, right: this.pageMargin },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 40, halign: 'center' }
            },
            // Add custom styling based on priority
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    const priority = priorityOrder[data.row.index];
                    const colors = {
                        'urgent': [239, 68, 68], // danger
                        'high': [245, 158, 11],  // warning
                        'medium': [59, 130, 246], // secondary
                        'low': [16, 185, 129]     // success
                    };
                }
            }
        });
        
        this.currentY = this.pdfDoc.lastAutoTable.finalY + 10;
    }
    
    /**
     * Add technician performance section to PDF
     */
    addTechnicianSection(reportData) {
        // Check if we need to add a new page
        if (this.currentY > 180) {
            this.pdfDoc.addPage();
            this.currentY = this.pageMargin;
        }
        
        // Section header
        this.pdfDoc.setFont("helvetica", "bold");
        this.pdfDoc.setTextColor(this.colorPalette.dark[0], this.colorPalette.dark[1], this.colorPalette.dark[2]);
        this.pdfDoc.setFontSize(16);
        this.pdfDoc.text("Technician Performance", this.pageMargin, this.currentY);
        this.currentY += 8;
        
        // Prepare table data
        const tableHead = [['Technician', 'Assigned', 'Resolved', 'Avg. Resolution (days)', 'Completion Rate']];
        
        // Check if we have technician data
        if (Object.keys(reportData.technicianPerformance).length === 0) {
            // No data available
            this.pdfDoc.setFont("helvetica", "italic");
            this.pdfDoc.setTextColor(100, 100, 100);
            this.pdfDoc.setFontSize(12);
            this.pdfDoc.text("No technician assignment data available", this.pageMargin, this.currentY + 5);
            this.currentY += 15;
            return;
        }
        
        const tableBody = Object.entries(reportData.technicianPerformance).map(([techId, data]) => {
            const completionRate = data.assigned > 0 ? Math.round((data.resolved / data.assigned) * 100) : 0;
            return [
                techId, // In a real app, this would be the technician name
                data.assigned.toString(),
                data.resolved.toString(),
                data.avgResolutionDays.toString(),
                `${completionRate}%`
            ];
        });
        
        // Sort by completion rate descending
        tableBody.sort((a, b) => parseInt(b[4]) - parseInt(a[4]));
        
        // Add table
        this.pdfDoc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: this.currentY,
            margin: { left: this.pageMargin, right: this.pageMargin },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' }
            }
        });
        
        this.currentY = this.pdfDoc.lastAutoTable.finalY + 10;
    }
    
    /**
     * Add footer to PDF page
     */
    addFooter(pageNumber, totalPages, reportDate) {
        const footerY = this.pdfDoc.internal.pageSize.height - 10;
        
        // Add footer text
        this.pdfDoc.setFont("helvetica", "normal");
        this.pdfDoc.setTextColor(100, 100, 100);
        this.pdfDoc.setFontSize(8);
        
        // Left: Report date
        this.pdfDoc.text(`Generated: ${reportDate}`, this.pageMargin, footerY);
        
        // Center: BUP Maintenance HUB
        this.pdfDoc.text("BUP Maintenance HUB - Administrative Report", this.pageWidth / 2, footerY, { align: "center" });
        
        // Right: Page number
        this.pdfDoc.text(`Page ${pageNumber} of ${totalPages}`, this.pageWidth - this.pageMargin, footerY, { align: "right" });
    }
    
    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        if (!category) return 'Unknown';
        
        const categoryMap = {
            'furniture': 'Furniture',
            'electricity': 'Electricity',
            'sanitary': 'Sanitary',
            'lab': 'Laboratory',
            'cafeteria': 'Cafeteria',
            'transportation': 'Transportation',
            'other': 'Other',
            'uncategorized': 'Uncategorized'
        };
        
        return categoryMap[category] || category.replace(/-|_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format priority name for display
     */
    formatPriorityName(priority) {
        if (!priority) return 'Unknown';
        
        const priorityMap = {
            'urgent': 'Urgent',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        
        return priorityMap[priority] || priority.charAt(0).toUpperCase() + priority.slice(1);
    }
}

// Create and export global instance
window.reportGenerator = new ReportGenerator();
