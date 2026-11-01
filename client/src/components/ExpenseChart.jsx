
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function ExpenseChart({ expenses }) {
    const categoryTotals = expenses.reduce((result, expense) => {
        const category = expense.category;
        const amount = Number(expense.amount);

        result[category] = (result[category] || 0) + amount;

        return result;
    }, {});

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    const chartData = {
        labels: categories,
        datasets: [{
            data: amounts,
            backgroundColor: [
                '#C08552',
                '#895737',
                '#5E3023',
                '#D6B99B',
                '#E8D2BC',
                '#A67C52'
            ],
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        family: 'Inter',
                        size: 13
                    }
                }
            },
            datalabels: {
                color: '#FFFFFF',
                font: {
                    weight: 'bold',
                    size: 13
                },
                formatter: (value) => {
                    const percentage = (value / total) * 100;
                    return `${percentage.toFixed(1)}%`;
                }
            }
        },
        cutout: '65%'
    };

    return (
        <div className="chart-section">
            <h2>Spending Distribution</h2>

            {categories.length === 0 ? (
                <p className="empty-chart">
                    Add expenses to view your spending chart.
                </p>
            ) : (
                <div className="chart-container">
                    <Doughnut
                        data={chartData}
                        options={chartOptions}
                    />
                </div>
            )}
        </div>
    );
}

export default ExpenseChart;
