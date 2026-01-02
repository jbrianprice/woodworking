import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Delete, 
  Ruler, 
  History, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  X,
  Sun,
  Moon
} from 'lucide-react';

const WoodworkingCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [unit, setUnit] = useState('in'); // 'in' or 'mm'
  const [precision, setPrecision] = useState(16); // 8, 16, 32, 64, 128
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [lastOp, setLastOp] = useState(null);
  const [resetNext, setResetNext] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // History State
  const [history, setHistory] = useState([]);

  // Constants
  const IN_TO_MM = 25.4;

  // --- Effects ---

  // Initialize Theme (System vs LocalStorage)
  useEffect(() => {
    const localTheme = localStorage.getItem('woodcalc_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (localTheme) {
      setIsDarkMode(localTheme === 'dark');
    } else {
      setIsDarkMode(systemPrefersDark.matches);
    }

    const handler = (e) => {
      if (!localStorage.getItem('woodcalc_theme')) {
        setIsDarkMode(e.matches);
      }
    };

    systemPrefersDark.addEventListener('change', handler);
    return () => systemPrefersDark.removeEventListener('change', handler);
  }, []);

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem('woodcalc_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('woodcalc_history', JSON.stringify(history));
  }, [history]);

  // Scroll history
  const historyEndRef = useRef(null);
  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showHistory, history]);

  // --- Helpers ---

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('woodcalc_theme', newMode ? 'dark' : 'light');
  };

  const gcd = (a, b) => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const toFraction = (value, denominator) => {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let whole = Math.floor(absValue);
    const remainder = absValue - whole;
    
    let num = Math.round(remainder * denominator);
    let den = denominator;

    if (num === den) {
      whole += 1;
      num = 0;
    }

    if (num === 0) {
      return { whole: isNegative ? -whole : whole, num: 0, den: 1, str: `${isNegative && whole !== 0 ? '-' : ''}${whole}"` };
    }

    const common = gcd(num, den);
    const simplifiedNum = num / common;
    const simplifiedDen = den / common;

    const fractionPart = `${simplifiedNum}/${simplifiedDen}`;
    const wholePart = whole !== 0 ? `${whole} ` : '';
    const sign = isNegative ? '-' : '';

    return {
      whole: isNegative ? -whole : whole,
      num: simplifiedNum,
      den: simplifiedDen,
      str: `${sign}${wholePart}${fractionPart}"`
    };
  };

  const formatNumber = (num) => {
    if (!isFinite(num)) return 'Error';
    return parseFloat(num.toFixed(4)).toString();
  };

  // --- Actions ---

  const handleNum = (num) => {
    if (resetNext) {
      setDisplay(num);
      setResetNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDot = () => {
    if (resetNext) {
      setDisplay('0.');
      setResetNext(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (op) => {
    const currentVal = display;
    setEquation(prev => {
        if (resetNext && !lastOp) {
             return `${currentVal} ${op}`;
        }
        return `${prev} ${currentVal} ${op}`;
    });
    setDisplay('0');
    setLastOp(op);
    setResetNext(false);
  };

  const handleParenthesis = (type) => {
    if (type === '(') {
      setEquation(prev => {
          if (prev === '' && display === '0') return '( ';
          if (lastOp) return `${prev} ( `;
          return `${prev} ${display} * ( `; 
      });
      setDisplay('0');
      setResetNext(false);
    } else {
      setEquation(prev => `${prev} ${display} )`);
      setDisplay('0'); 
      setResetNext(false); 
    }
  };

  const handleSquare = () => {
    const val = parseFloat(display);
    const res = val * val;
    setDisplay(formatNumber(res));
    setResetNext(true);
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val < 0) {
        setDisplay("Error");
        return;
    }
    const res = Math.sqrt(val);
    setDisplay(formatNumber(res));
    setResetNext(true);
  };

  const calculate = () => {
    if (!equation && !lastOp) return;
    
    let fullEq = `${equation} ${display}`;
    
    if (fullEq.trim().endsWith(') 0')) {
        fullEq = fullEq.slice(0, -2);
    }

    const cleanEq = fullEq.replace(/[^-()\d/*+.]/g, '');
    
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + cleanEq)();
      const formattedResult = formatNumber(result);
      
      const newHistoryItem = {
        id: Date.now(),
        eq: fullEq.trim(),
        res: formattedResult,
        unit: unit
      };
      
      setHistory(prev => {
          const updated = [...prev, newHistoryItem];
          return updated.slice(-50);
      });

      setDisplay(formattedResult);
      setEquation('');
      setLastOp(null);
      setResetNext(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setLastOp(null);
    setResetNext(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('woodcalc_history');
  };

  const loadFromHistory = (item) => {
    setDisplay(item.res);
    setResetNext(true);
    setShowHistory(false);
  };

  const backspace = () => {
    if (resetNext) return;
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const toggleUnit = () => {
    const val = parseFloat(display);
    if (unit === 'in') {
      setUnit('mm');
      setDisplay(formatNumber(val * IN_TO_MM));
    } else {
      setUnit('in');
      setDisplay(formatNumber(val / IN_TO_MM));
    }
    setResetNext(true);
  };

  // --- Keyboard Support ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;

      if (/^\d$/.test(key)) {
        e.preventDefault();
        handleNum(key);
      } else if (key === '.') {
        e.preventDefault();
        handleDot();
      } else if (key === '+' || key === '-' || key === '/' || key === '*') {
        e.preventDefault();
        handleOp(key);
      } else if (key.toLowerCase() === 'x') {
        e.preventDefault();
        handleOp('*');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        clear();
      } else if (key === '(') {
        e.preventDefault();
        handleParenthesis('(');
      } else if (key === ')') {
        e.preventDefault();
        handleParenthesis(')');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, lastOp, resetNext, unit]); // Dependencies ensure fresh state

  // --- Components ---

  const FractionDisplay = ({ val, precision }) => {
    if (unit === 'mm') return null;
    const f = toFraction(val, precision);
    return (
      <div className="flex flex-col items-end animate-in fade-in">
        <span className="text-3xl font-bold text-amber-600 dark:text-amber-500 font-mono tracking-tight transition-colors">{f.str}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">@{precision}th precision</span>
      </div>
    );
  };

  const SecondaryDisplay = ({ val }) => {
    let converted;
    let unitLabel;
    
    if (unit === 'in') {
      converted = formatNumber(val * IN_TO_MM);
      unitLabel = 'mm';
    } else {
      converted = formatNumber(val / IN_TO_MM);
      unitLabel = 'in';
    }

    return (
      <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 transition-colors">
        = {converted} {unitLabel}
      </div>
    );
  };

  const Button = ({ children, onClick, className = "", variant = "default" }) => {
    const baseStyle = "rounded-xl font-semibold text-xl transition-all active:scale-95 flex items-center justify-center select-none shadow-sm";
    const height = isAdvanced ? "h-12 sm:h-14" : "h-14 sm:h-16";
    
    // Updated variants with Light/Dark support
    const variants = {
      default: "bg-slate-200 text-slate-700 border-b-4 border-slate-300 hover:bg-slate-300 active:border-b-0 active:translate-y-1 dark:bg-slate-700 dark:text-white dark:border-slate-900 dark:hover:bg-slate-600",
      
      primary: "bg-amber-500 text-white border-b-4 border-amber-700 hover:bg-amber-400 active:border-b-0 active:translate-y-1 dark:bg-amber-600 dark:border-amber-800 dark:hover:bg-amber-500",
      
      action: "bg-slate-300 text-slate-800 border-b-4 border-slate-400 hover:bg-slate-400 active:border-b-0 active:translate-y-1 dark:bg-slate-600 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-500",
      
      danger: "bg-red-100 text-red-700 border-b-4 border-red-200 hover:bg-red-200 active:border-b-0 active:translate-y-1 dark:bg-red-900/40 dark:text-red-200 dark:border-red-900 dark:hover:bg-red-900/60",
      
      secondary: "bg-slate-100 text-amber-600 border-b-4 border-slate-200 hover:bg-slate-200 active:border-b-0 active:translate-y-1 dark:bg-slate-800 dark:text-amber-500 dark:border-slate-900 dark:hover:bg-slate-700"
    };

    return (
      <button onClick={onClick} className={`${height} ${baseStyle} ${variants[variant]} ${className}`}>
        {children}
      </button>
    );
  };

  return (
    // Outer Wrapper handles the 'dark' class based on state
    <div className={`${isDarkMode ? 'dark' : ''} transition-colors duration-300`}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 font-sans relative transition-colors duration-300">
        {/* Main Calculator Container - removed max-h-[90vh] so it grows */}
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative flex flex-col transition-colors duration-300">
          
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 z-20 relative transition-colors duration-300">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Ruler size={18} className="text-amber-600 dark:text-amber-500" />
              <span className="font-bold tracking-wider uppercase text-sm">WoodCalc Pro</span>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
              >
                <History size={20} />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* History Overlay */}
          {showHistory && (
            <div className="absolute inset-0 top-[60px] bg-slate-50/95 dark:bg-slate-900/95 z-30 p-4 animate-in slide-in-from-bottom-10 backdrop-blur-sm flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h3 className="text-slate-800 dark:text-slate-200 font-bold">Calculation History</h3>
                  <button onClick={clearHistory} className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1 hover:text-red-700 dark:hover:text-red-300">
                      <Trash2 size={14}/> Clear
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                      <div className="text-slate-400 dark:text-slate-500 text-center mt-10 italic">No history yet</div>
                  ) : (
                      history.map((item) => (
                          <button 
                              key={item.id} 
                              onClick={() => loadFromHistory(item)}
                              className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg flex flex-col items-end hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">{item.eq}</span>
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-500">{item.res} <span className="text-xs text-slate-400 dark:text-slate-500">{item.unit}</span></span>
                          </button>
                      ))
                  )}
                  <div ref={historyEndRef} />
              </div>
              <button 
                  onClick={() => setShowHistory(false)}
                  className="mt-4 w-full py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                  Close
              </button>
            </div>
          )}

          {/* Settings Panel - Now integrated into flow (removed absolute) */}
          {showSettings && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 bg-slate-50 dark:bg-slate-900/50 shadow-inner">
              <div className="flex justify-between items-center mb-3">
                   <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fraction Precision</label>
                   <button onClick={() => setShowSettings(false)}><X size={16} className="text-slate-500" /></button>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[8, 16, 32, 64, 128].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrecision(p)}
                    className={`py-2 rounded-md text-sm font-medium transition-all ${
                      precision === p 
                        ? 'bg-amber-500 text-white dark:text-slate-900 shadow-lg' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    1/{p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Screen */}
          <div className="bg-slate-200 dark:bg-slate-950 p-6 flex flex-col items-end gap-1 relative overflow-hidden shrink-0 transition-colors duration-300">
            {/* History / Equation */}
            <div className="text-slate-500 dark:text-slate-500 text-sm h-6 font-mono whitespace-nowrap overflow-hidden text-ellipsis w-full text-right">
              {equation}
            </div>

            {/* Main Decimal Display */}
            <div className="flex items-baseline gap-2 text-slate-800 dark:text-slate-100 w-full justify-end transition-colors">
               <span className="text-5xl font-light tracking-tight truncate">{display}</span>
               <span className="text-xl text-slate-500 font-medium">{unit}</span>
            </div>

            {/* Conditional Displays */}
            <div className="w-full flex justify-between items-end mt-4 pt-4 border-t border-slate-300 dark:border-slate-800/50 min-h-[80px]">
              <SecondaryDisplay val={parseFloat(display) || 0} />
              <FractionDisplay val={parseFloat(display) || 0} precision={precision} />
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 opacity-20"></div>
          </div>

          {/* Controls */}
          {/* Removed flex-1 and overflow-y-auto so the calculator grows naturally */}
          <div className="p-4 bg-white dark:bg-slate-800 transition-colors duration-300">
            
            {/* Mode Toggle */}
            <div className="flex justify-center mb-3">
               <button 
                  onClick={() => setIsAdvanced(!isAdvanced)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400 py-1 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
               >
                  {isAdvanced ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                  {isAdvanced ? "SIMPLE MODE" : "ADVANCED MODE"}
               </button>
            </div>

            {/* Top Actions */}
            <div className="grid grid-cols-4 gap-2 mb-2">
               <Button variant="danger" onClick={clear}>AC</Button>
               <Button variant="action" onClick={backspace}><Delete size={20} /></Button>
               <Button variant="action" onClick={toggleUnit} className="flex flex-col items-center justify-center leading-none gap-1">
                  <span className="text-xs opacity-70">Unit</span>
                  <span className="text-sm font-bold">{unit === 'in' ? 'IN' : 'MM'}</span>
               </Button>
               <Button variant="primary" onClick={() => handleOp('/')} className="text-2xl">÷</Button>
            </div>

            {/* Advanced Row */}
            {isAdvanced && (
              <div className="grid grid-cols-4 gap-2 mb-2 animate-in slide-in-from-top-4">
                  <Button variant="secondary" onClick={() => handleParenthesis('(')}>(</Button>
                  <Button variant="secondary" onClick={() => handleParenthesis(')')}>)</Button>
                  <Button variant="secondary" onClick={handleSquare} className="text-lg">x²</Button>
                  <Button variant="secondary" onClick={handleSqrt} className="text-lg">√</Button>
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2">
              <Button onClick={() => handleNum('7')}>7</Button>
              <Button onClick={() => handleNum('8')}>8</Button>
              <Button onClick={() => handleNum('9')}>9</Button>
              <Button variant="primary" onClick={() => handleOp('*')} className="text-2xl">×</Button>

              <Button onClick={() => handleNum('4')}>4</Button>
              <Button onClick={() => handleNum('5')}>5</Button>
              <Button onClick={() => handleNum('6')}>6</Button>
              <Button variant="primary" onClick={() => handleOp('-')} className="text-2xl">-</Button>

              <Button onClick={() => handleNum('1')}>1</Button>
              <Button onClick={() => handleNum('2')}>2</Button>
              <Button onClick={() => handleNum('3')}>3</Button>
              <Button variant="primary" onClick={() => handleOp('+')} className="text-2xl">+</Button>

              <Button onClick={() => handleNum('0')} className="col-span-2">0</Button>
              <Button onClick={handleDot}>.</Button>
              <Button variant="primary" onClick={calculate} className="bg-amber-600 border-amber-800">=</Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WoodworkingCalculator;