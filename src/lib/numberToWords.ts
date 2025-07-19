const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function convertHundreds(num: number): string {
    let result = '';
    if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' hundred ';
        num %= 100;
    }
    if (num >= 10 && num <= 19) {
        result += teens[num - 10] + ' ';
    } else {
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        }
        if (num > 0) {
            result += ones[num] + ' ';
        }
    }
    return result;
}

function inWords(num: number): string {
    if (num === 0) return 'zero';

    let words = '';
    if (num >= 10000000) {
        words += convertHundreds(Math.floor(num / 10000000)) + 'crore ';
        num %= 10000000;
    }
    if (num >= 100000) {
        words += convertHundreds(Math.floor(num / 100000)) + 'lakh ';
        num %= 100000;
    }
    if (num >= 1000) {
        words += convertHundreds(Math.floor(num / 1000)) + 'thousand ';
        num %= 1000;
    }
    if (num > 0) {
        words += convertHundreds(num);
    }
    return words.trim();
}

export function numberToWords(num: number): string {
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let words = inWords(integerPart);
    if (decimalPart > 0) {
        words += ' and ' + inWords(decimalPart) + ' paisa';
    }
    
    return words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Only';
}