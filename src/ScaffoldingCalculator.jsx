// --- Подключение зависимостей ---
import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Packer, Document, Paragraph, TextRun } from 'docx';

// --- Стили ---
// Стили остаются без изменений, поэтому для краткости я их свернул.
// В реальном файле они будут здесь, как и прежде.
const styles = `
  /* ... все ваши стили ... */
  .scaffolding-calculator { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 700px; margin: 2rem auto; border-radius: 15px; overflow: hidden; box-shadow: 0 6px 25px rgba(0, 43, 85, 0.1); border: 1px solid #e0e7ff; background-color: #ffffff; }
  .calc-header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #fff; padding: 20px 25px; text-align: center; }
  .calc-header h2 { margin: 0; font-size: 24px; }
  .calc-body { padding: 25px 30px; }
  .form-group { margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #eef2f7; }
  .form-group:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
  .form-group-title { display: block; font-size: 18px; font-weight: 500; margin-bottom: 15px; color: #334155; }
  .radio-group { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; }
  .radio-group label { display: flex; align-items: center; cursor: pointer; padding: 10px 15px; border-radius: 8px; border: 1px solid #d1d5db; transition: all 0.2s ease; background-color: #f9fafb; }
  .radio-group input[type="radio"] { display: none; }
  .radio-group input[type="radio"]:checked + span { color: #007bff; font-weight: 500; }
  .radio-group label:has(input:checked) { border-color: #007bff; background-color: #f0f9ff; }
  label { display: block; margin-bottom: 8px; font-weight: 500; color: #4b5563; }
  input[type="number"], input[type="text"] { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; transition: border-color 0.2s ease, box-shadow 0.2s ease; font-size: 16px; }
  input[type="number"]:focus, input[type="text"]:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
  .btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 500; transition: all 0.2s ease; }
  .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
  .btn:disabled { background: #ced4da; cursor: not-allowed; }
  .result-block { margin-top: 30px; padding: 25px; border-radius: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; }
  .result-block h3, .result-block h4 { color: #0056b3; margin-top: 0; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 15px; }
  .result-value { font-size: 28px; font-weight: bold; color: #28a745; margin-bottom: 20px; text-align: center; }
  .result-details p { margin: 0 0 12px 0; line-height: 1.6; }
  .result-details code { background-color: #e9ecef; padding: 3px 6px; border-radius: 4px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; }
  .error-block { background-color: #fff5f5; border-color: #fecaca; }
  .error-block h4 { color: #dc2626; border-color: #ef4444; }
  .error-block p { color: #b91c1c; }
  .formula-breakdown { background-color: #eef2f7; padding: 15px; border-radius: 8px; margin-top: 15px; }
  .formula-breakdown ul { padding-left: 20px; margin: 0; }
  .coefficient-block { border-top: 1px solid #d1d5db; padding-top: 15px; margin-top: 15px; }
  .accordion-header { background: none; border: none; width: 100%; text-align: left; padding: 10px 0; font-size: 16px; cursor: pointer; border-bottom: 1px solid #e0e7ff; color: #1e3a8a; }
  .accordion-content { overflow: hidden; transition: max-height 0.3s ease-out; background-color: #f0f9ff; padding: 0 15px; border-radius: 0 0 8px 8px; }
  .accordion-content p { padding: 15px 0; margin: 0; }
  .export-buttons { margin-top: 20px; text-align: center; }
  .btn-export { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; font-weight: 500; }
  .btn-word { background-color: #2b579a; color: white; }
  .btn-word:hover { background-color: #1e3c6a; }
`;

function ScaffoldingCalculator() {
  // --- Состояния (State) для хранения данных ---
  const [location, setLocation] = useState('outside');
  const [insideType, setInsideType] = useState('ceiling');
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [inputs, setInputs] = useState({
    height: '',
    length: '',
    roomWidth: '',
    roomLength: '',
    scaffoldWidth: '',
    wallsLength: ''
  });
  
  // --- ИЗМЕНЕНИЕ №1: При первой загрузке компонента, мы сразу пытаемся достать токен из "кармана" (localStorage) ---
  // Если в localStorage что-то есть, мы используем это значение. Если нет (||), токен будет пустой строкой.
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Эффект для автоматического получения токена из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // --- ИЗМЕНЕНИЕ №2: Если мы нашли токен в URL, мы немедленно сохраняем его в "карман" (localStorage) ---
      // Ключ 'accessToken' - это название нашей "ячейки" в хранилище.
      localStorage.setItem('accessToken', tokenFromUrl);
      
      setToken(tokenFromUrl);
      // Очищаем URL, чтобы токен не оставался видимым
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Пустой массив зависимостей означает, что этот код выполнится только один раз при "рождении" компонента.

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Пожалуйста, введите ваш токен доступа или получите новый.');
      setResult(null);
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    const apiData = {
      token,
      location,
      ...inputs
    };
    if (location === 'inside') {
      apiData.insideType = insideType;
    }
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/calculate-scaffolding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Произошла неизвестная ошибка.');
      }
    } catch (err) {
      setError('Не удалось связаться с сервером. Проверьте ваше интернет-соединение.');
    } finally {
      setLoading(false);
    }
  };

  const exportToWord = () => {
    if (!result) return;

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Результат расчета объема работ по устройству лесов', bold: true, size: 32 })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Общий объем работ (V): ', bold: true }),
              new TextRun({ text: `${result.volume} м²`, bold: true, color: "28a745" }),
            ],
          }),
           new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Формула расчета: ', bold: true }),
              new TextRun({ text: result.formula, font: { name: 'Courier New' } }),
            ],
          }),
          ...result.formulaBreakdown.map(line => new Paragraph({ text: `  - ${line}`, style: "ListParagraph" })),
          ...(result.coefficient ? [
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [ new TextRun({ text: result.coefficient.explanation, bold: true })]
            }),
             new Paragraph({
              children: [ 
                  new TextRun({ text: 'Формула коэффициента: ', bold: true }),
                  new TextRun({ text: result.coefficient.formula, font: { name: 'Courier New' } })
              ]
            }),
          ] : []),
           new Paragraph({ text: '' }),
           new Paragraph({
            children: [new TextRun({ text: 'Обоснование:', bold: true, underline: {} })],
          }),
          new Paragraph({
             children: [new TextRun({ text: result.justification.title, bold: true })],
          }),
          new Paragraph({
             children: [new TextRun({ text: result.justification.text })],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'Расчет_лесов.docx');
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="scaffolding-calculator">
        <div className="calc-header">
          <h2>Калькулятор объема работ по устройству лесов</h2>
        </div>
        <div className="calc-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="token-input">Ваш токен доступа</label>
                <input 
                    id="token-input"
                    type="text" 
                    value={token} 
                    onChange={(e) => setToken(e.target.value)} 
                    placeholder="Введите токен, полученный от бота" 
                    required 
                />
            </div>

            <div className="form-group">
              <div className="form-group-title">1. Местоположение лесов</div>
              <div className="radio-group">
                <label>
                  <input type="radio" name="location" value="outside" checked={location === 'outside'} onChange={(e) => setLocation(e.target.value)} />
                  <span>Снаружи здания (по фасаду)</span>
                </label>
                <label>
                  <input type="radio" name="location" value="inside" checked={location === 'inside'} onChange={(e) => setLocation(e.target.value)} />
                  <span>Внутри здания</span>
                </label>
              </div>
            </div>

            {location === 'outside' && (
              <div className="form-group">
                <div className="form-group-title">2. Параметры для наружных лесов</div>
                <div>
                  <label>Высота лесов (H), м</label>
                  <input type="number" step="0.01" name="height" value={inputs.height} onChange={handleInputChange} placeholder="например, 24" required />
                </div>
                <div style={{marginTop: '15px'}}>
                  <label>Длина лесов по фасаду (L), м</label>
                  <input type="number" step="0.01" name="length" value={inputs.length} onChange={handleInputChange} placeholder="например, 50" required />
                </div>
              </div>
            )}

            {location === 'inside' && (
              <>
                <div className="form-group">
                  <div className="form-group-title">2. Тип работ внутри здания</div>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="insideType" value="ceiling" checked={insideType === 'ceiling'} onChange={(e) => setInsideType(e.target.value)} />
                      <span>Отделка потолков</span>
                    </label>
                    <label>
                      <input type="radio" name="insideType" value="walls" checked={insideType === 'walls'} onChange={(e) => setInsideType(e.target.value)} />
                      <span>Отделка стен</span>
                    </label>
                  </div>
                </div>

                {insideType === 'ceiling' && (
                  <div className="form-group">
                    <div className="form-group-title">3. Параметры для отделки потолков</div>
                    <div>
                      <label>Длина помещения (Lпом), м</label>
                      <input type="number" step="0.01" name="roomLength" value={inputs.roomLength} onChange={handleInputChange} placeholder="например, 12" required />
                    </div>
                    <div style={{marginTop: '15px'}}>
                      <label>Ширина помещения (Wпом), м</label>
                      <input type="number" step="0.01" name="roomWidth" value={inputs.roomWidth} onChange={handleInputChange} placeholder="например, 8" required />
                    </div>
                  </div>
                )}

                {insideType === 'walls' && (
                  <div className="form-group">
                    <div className="form-group-title">3. Параметры для отделки стен</div>
                    <div>
                      <label>Общая длина стен (Lстен), м</label>
                      <input type="number" step="0.01" name="wallsLength" value={inputs.wallsLength} onChange={handleInputChange} placeholder="например, 36" required />
                    </div>
                    <div style={{marginTop: '15px'}}>
                      <label>Ширина настила лесов (Wнастила), м</label>
                      <input type="number" step="0.01" name="scaffoldWidth" value={inputs.scaffoldWidth} onChange={handleInputChange} placeholder="например, 1.5" required />
                    </div>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
          </form>

          {error && (
            <div className="result-block error-block">
              <h4>Ошибка</h4>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="result-block">
              <h3>Результат расчета</h3>
              <div className="result-value">{result.volume} м²</div>
              <div className="result-details">
                <p>Формула расчета: <code>{result.formula}</code></p>
                <div className="formula-breakdown">
                  <p>где:</p>
                  <ul>{result.formulaBreakdown.map((line, i) => <li key={i}>{line}</li>)}</ul>
                </div>
                {result.coefficient && (
                  <div className="coefficient-block">
                    <p><strong>{result.coefficient.explanation}</strong></p>
                    <p>Формула коэффициента: <code>{result.coefficient.formula}</code></p>
                  </div>
                )}
                
                <button type="button" className="accordion-header" onClick={() => setAccordionOpen(!accordionOpen)}>
                    <strong>Обоснование:</strong> {result.justification.title}
                </button>
                <div className="accordion-content" style={{maxHeight: accordionOpen ? '200px' : '0'}}>
                    <p>{result.justification.text}</p>
                </div>
                
                <div className="export-buttons">
                    <button onClick={exportToWord} className="btn-export btn-word">Экспорт в Word (.doc)</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default ScaffoldingCalculator;
