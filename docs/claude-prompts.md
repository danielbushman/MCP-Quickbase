# Claude Desktop Prompts for Quickbase Construction Management

This document provides natural language prompts you can use directly in Claude Desktop to manage your construction projects through Quickbase MCP Server. Simply copy and paste these prompts, then modify the details as needed.

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Project Management](#project-management)
3. [Workforce & Crew Management](#workforce--crew-management)
4. [Materials & Inventory](#materials--inventory)
5. [Safety & Incident Management](#safety--incident-management)
6. [Reporting & Analytics](#reporting--analytics)

## Daily Operations

### Morning Crew Check-in
```
Check our Quickbase system and show me which crews are working today, what projects they're assigned to, and who's leading each crew. Also tell me if any crews don't have active assignments.
```

### Log Daily Work Progress
```
Add a work log entry to Quickbase: The Concrete Crew worked 8.5 hours today on the Commercial Building project, completing the foundation pour for section C. Quality inspection passed and we're on schedule for the next phase.
```

### End-of-Day Summary
```
Generate an end-of-day report from Quickbase showing: 1) All work logged today with hours and crews, 2) Any safety incidents reported, 3) Materials that are running low, and 4) tasks that were completed or updated today.
```

### Quick Status Check
```
Give me a quick status update from Quickbase on our top 3 active projects - show me the project names, current status, percentage complete, and any recent work activity.
```

## Project Management

### Weekly Project Dashboard
```
Create a comprehensive weekly project report from Quickbase showing all active projects with their status, budget, timeline, assigned crews, total hours worked this week, and any tasks that are behind schedule.
```

### Update Task Progress
```
In Quickbase, update the "Steel Frame Installation" task on the Commercial Building project to 75% complete. Also log that we installed beams on floors 4-5 today and the structural engineer approved all connections.
```

### Project Timeline Analysis
```
Analyze our Quickbase project data and identify which projects are running behind schedule, which are ahead, and provide recommendations for resource reallocation to get back on track.
```

### Add New Project Task
```
Add a new task to Quickbase for the Residential Apartments project: "HVAC Rough-in Building B" scheduled from June 1-15, 2025, assigned to the HVAC Crew, with 0% completion status.
```

### Project Budget Tracking
```
Calculate the current labor costs for each active project in Quickbase by looking at total hours worked and crew rates. Compare this to the project budgets and show which projects are over/under budget.
```

## Workforce & Crew Management

### Employee Productivity Report
```
Generate an employee productivity report from Quickbase showing each worker's total hours in the last 30 days, their hourly rate, crew assignment, and calculate their contribution to project progress.
```

### Crew Assignment Optimization
```
Analyze our Quickbase crew data and suggest optimal crew assignments based on current project needs, crew specializations, and workload distribution. Show which crews are overloaded or underutilized.
```

### Add New Employee
```
Add a new employee to Quickbase: Sarah Martinez, HVAC Technician, $31.50/hour, assign her to the HVAC Crew, email: smartinez@construction.com.
```

### Crew Performance Analysis
```
Compare the performance of all our crews in Quickbase by analyzing their total hours worked, number of tasks completed, and projects they've contributed to. Rank them by productivity.
```

### Training Needs Assessment
```
Review our Quickbase employee data and identify who needs safety training based on their job roles. Show required certifications for each position and current training status.
```

## Materials & Inventory

### Inventory Status Check
```
Check our Quickbase materials inventory and show me everything that's below the reorder threshold. Group the results by supplier and include contact information so I can place orders.
```

### Material Usage Tracking
```
Analyze material consumption from our Quickbase work logs for the Commercial Building project. Look for mentions of concrete, steel, electrical materials, and lumber in the work notes and summarize usage patterns.
```

### Automated Reorder Report
```
Generate purchase orders from Quickbase for all materials below reorder levels. Group by supplier, calculate recommended order quantities (2x the reorder threshold), and format as a professional purchase order request.
```

### Material Cost Analysis
```
Calculate the total material costs per project in Quickbase by analyzing inventory usage and current material quantities. Estimate the remaining material budget for each active project.
```

### Supplier Performance Review
```
Evaluate our suppliers in Quickbase by looking at which materials we order most frequently, delivery reliability (based on when materials were restocked), and identify our most critical supplier relationships.
```

## Safety & Incident Management

### Safety Dashboard
```
Create a comprehensive safety dashboard from Quickbase showing: incident counts by type and location, recent safety events, crews with the most incidents, and overall safety trends for the last 90 days.
```

### Report New Safety Incident
```
Log a new safety incident in Quickbase: Today a painter slipped on a wet floor in the Commercial Building. No injury occurred, but we've added additional warning signs and non-slip mats. Assign to Painting Crew and Safety Coordinator for follow-up.
```

### Safety Training Compliance
```
Check our Quickbase system and identify which employees need safety training renewals based on their job roles. Show required certifications for electricians, equipment operators, and crew leaders.
```

### Incident Trend Analysis
```
Analyze safety incident patterns in Quickbase over the last 6 months. Identify which types of incidents are most common, which projects or locations have the most issues, and recommend prevention strategies.
```

### Safety Performance by Location
```
Compare safety performance across all our Quickbase project locations. Show incident rates, types of incidents, and identify which sites need additional safety measures or training.
```

## Reporting & Analytics

### Executive Summary Report
```
Generate an executive summary from Quickbase for our construction operations including: total active projects, workforce size, budget status, safety metrics, material costs, and key performance indicators for the current month.
```

### Resource Utilization Analysis
```
Analyze our Quickbase data to show how efficiently we're using our resources. Calculate crew utilization rates, equipment usage, material turnover, and identify areas for improvement.
```

### Project Profitability Analysis
```
Calculate project profitability from Quickbase by comparing budgets to actual costs (labor hours × rates + estimated materials). Rank projects by profit margin and identify the most/least profitable.
```

### Predictive Timeline Analysis
```
Based on current progress rates in Quickbase, predict completion dates for all active projects. Identify projects that may miss their deadlines and suggest corrective actions.
```

### Client Project Portfolio
```
Show me a client-focused view from Quickbase - for each client, list their projects, current status, total contract value, and any issues or concerns that need attention.
```

### Custom KPI Dashboard
```
Create a custom KPI dashboard from Quickbase showing: projects on time vs. delayed, total labor hours this month vs. last month, safety incident rate, inventory turnover, and crew productivity metrics.
```

## Advanced Queries

### Cross-Project Resource Analysis
```
Analyze our Quickbase data to show which crews are working on multiple projects simultaneously. Identify potential scheduling conflicts and recommend optimizations for better project focus.
```

### Quality Control Tracking
```
Track quality metrics across our Quickbase projects by analyzing work log notes for mentions of inspections, rework, quality issues, and approvals. Summarize quality performance by crew and project.
```

### Weather Impact Analysis
```
Review our Quickbase work logs for weather-related delays or notes. Calculate lost productivity due to weather and identify which projects and crews are most affected by weather conditions.
```

### Supply Chain Risk Assessment
```
Analyze our Quickbase supplier and material data to identify supply chain risks. Show which materials have single suppliers, long lead times, or frequent stockouts that could impact projects.
```

### Seasonal Workforce Planning
```
Based on historical Quickbase data, analyze seasonal patterns in our workforce needs, project types, and resource requirements. Predict staffing needs for the next quarter.
```

## Tips for Using These Prompts

1. **Be Specific**: Include project names, employee names, or specific dates when relevant
2. **Ask for Follow-ups**: Add "and suggest next steps" or "and recommend actions" to get actionable insights
3. **Combine Requests**: You can combine multiple queries, like "Show me safety incidents AND material usage for the Commercial Building project"
4. **Request Formatting**: Specify how you want results displayed: "format as a table," "create a bulleted list," or "generate a professional report"
5. **Set Time Ranges**: Use phrases like "in the last 30 days," "this quarter," or "since January 1st" to focus on specific periods

## Sample Conversation Starters

- "I need to prepare for our Monday morning project meeting. Can you pull together a comprehensive status report from Quickbase?"
- "We're having safety issues on the Downtown site. Help me analyze what's happening and what we can do about it."
- "The client is asking about budget status. Can you calculate our current costs vs. budget for the Residential Apartments project?"
- "I need to optimize our crew assignments for next week. Show me who's available and what needs to be done."
- "Help me identify which materials we need to reorder urgently and which suppliers to contact."

Remember: Claude can access your Quickbase data in real-time through the MCP connector, so you'll get current information for all your queries!