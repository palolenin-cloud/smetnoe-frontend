// --- Подключение зависимостей ---
import React, { useState, useEffect } from 'react';

// --- Стили ---
const styles = `
  /* ... (здесь находятся все стили, они остались без изменений) ... */
  .scaffolding-calculator { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 700px; margin: 2rem auto; border-radius: 15px; overflow: hidden; box-shadow: 0 6px 25px rgba(0, 43, 85, 0.1); border: 1px solid #e0e7ff; background-color: #ffffff; }
  .calc-header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #fff; padding: 20px 25px; text-align: center; }
  .calc-header h2 { margin: 0; font-size: 24px; }
  .calc-body { padding: 25px 30px; }
  .form-group { margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #eef2f7; }
  .form-group:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
  .form-group-title { display: block; font-size: 18px; font-weight: 500; margin-bottom: 15px; color: #334155; }
  .options-group label { display: block; background-color: #f8fafc; padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s ease-in-out; }
  .options-group label:hover { background-color: #f1f5f9; border-color: #007bff; }
  .options-group input[type="radio"]:checked + span { font-weight: 600; color: #0056b3; }
  .input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .input-field label { display: block; font-size: 15px; color: #475569; margin-bottom: 5px; }
  .input-field input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
  .calc-result { background-color: #f8faff; border: 1px solid #b3d7ff; border-radius: 10px; padding: 25px; margin-top: 30px; }
  .result-title { font-size: 18px; font-weight: 500; color: #334155; text-align: center; }
  .result-value { font-size: 36px; font-weight: 700; color: #0056b3; margin: 5px 0 10px; text-align: center; }
  .result-details code { background-color: #eef2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #1e293b; }
  .formula-breakdown { margin-top: 15px; padding-left: 15px; }
  .formula-breakdown ul { list-style-type: none; padding-left: 0; margin-top: 5px; }
  .coefficient-block { margin-top: 20px; padding-top: 20px; border-top: 1px dashed #b3d7ff; }
  .accordion-header { background-color: #eef2f7; cursor: pointer; padding: 12px 15px; width: 100%; border: none; text-align: left; font-size: 15px; border-radius: 8px; margin-top: 20px; }
  .accordion-content { padding: 10px 15px 0; font-style: italic; color: #64748b; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
  .export-buttons { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e0e7ff; display: flex; justify-content: center; gap: 15px; }
  .btn-export { font-size: 14px; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-word { background-color: #2b579a; color: white; }
  .btn-gdocs { background-color: #4285F4; color: white; }
`;

function ScaffoldingCalculator() {
  const [location, setLocation] = useState('');
  const [insideType, setInsideType] = useState('');
  const [inputs, setInputs] = useState({
    height: '', length: '', roomWidth: '',
    roomLength: '', scaffoldWidth: '', wallsLength: ''
  });
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const paymentId = urlParams.get('paymentId');

    if (window.location.pathname === '/payment-success' && userId && paymentId) {
        const fetchToken = async () => {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            try {
                const response = await fetch(`${apiUrl}/api/payment-success?userId=${userId}&paymentId=${paymentId}`);
                const data = await response.json();
                
                if (data.success && data.token) {
                    setToken(data.token);
                    alert(`Ваш токен доступа: ${data.token}\n\nОн скопирован в поле ввода. Теперь вы можете делать расчеты.`);
                    window.history.replaceState({}, document.title, window.location.pathname.replace('/payment-success', ''));
                } else {
                  alert(data.message || 'Произошла ошибка при получении токена.');
                }
            } catch (err) {
                alert('Не удалось связаться с сервером для получения токена. Попробуйте снова.');
            }
        };
        fetchToken();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const runCalculation = async () => {
    // Сначала очищаем старые результаты и ошибки
    setResult(null);
    setError('');

    // Проводим все проверки до отправки запроса
    if (!token) {
      setError('Пожалуйста, введите ваш токен доступа.');
      return; // Выходим из функции, если токена нет
    }
    if (!location || (location === 'inside' && !insideType)) {
      setError('Пожалуйста, выберите все необходимые опции для расчета.');
      return; // Выходим, если не все выбрано
    }
    
    setLoading(true);

    let dataToSend = { location, insideType, ...inputs };

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/calculate/scaffolding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(dataToSend)
      });
      const responseData = await response.json();
      if (responseData.success) {
        setResult(responseData);
      } else {
        setError(responseData.message || 'Произошла неизвестная ошибка');
      }
    } catch (err) {
      setError('Не удалось связаться с сервером.');
    } finally {
      setLoading(false);
    }
  };

  const generateExportContent = () => {
    if (!result) return '';
    let content = '<h1>Расчет объема строительных лесов</h1>';
    content += `<h2>Исходные данные:</h2><ul>`;
    content += `<li><strong>Расположение:</strong> ${location === 'outside' ? 'Снаружи здания' : 'Внутри здания'}</li>`;
    content += '</ul>';
    content += '<h2>Результаты расчета:</h2>';
    content += `<p><strong>Расчетный объем работ: ${result.volume} м²</strong></p>`;
    if(result.formula) { content += `<p><strong>Формула расчета:</strong> <code>${result.formula}</code></p>`; }
    if(result.formulaBreakdown) { content += `<ul>${result.formulaBreakdown.map(line => `<li>${line}</li>`).join('')}</ul>`; }
    if(result.coefficient) { content += `<p><strong>${result.coefficient.explanation}</strong></p><p>Формула коэффициента: <code>${result.coefficient.formula}</code></p>`; }
    if(result.justification) { content += `<h2>Обоснование:</h2><p><strong>${result.justification.title}:</strong></p><blockquote>${result.justification.text}</blockquote>`; }
    return content;
  }

  const exportToWord = () => {
    const content = generateExportContent();
    const sourceHTML = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Расчет</title></head><body>${content}</body></html>`;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    fileDownload.href = source;
    fileDownload.download = 'raschet-lesov.doc';
    fileDownload.click();
  };
  
  return (
    <>
      <style>{styles}</style>
      <div className="scaffolding-calculator">
        <div className="calc-header">
          <h2>Калькулятор объема строительных лесов</h2>
        </div>
        <div className="calc-body">
          <form onSubmit={(e) => { e.preventDefault(); runCalculation(); }}>
            
            <div className="form-group">
                <label className="form-group-title">Токен доступа</label>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Вставьте токен, полученный от бота"
                    style={{width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                />
            </div>
            
            <div className="form-group">
              <span className="form-group-title">1. Где будут устанавливаться леса?</span>
              <div className="options-group">
                <label><input type="radio" name="location" value="outside" checked={location === 'outside'} onChange={(e) => setLocation(e.target.value)} /> <span>Снаружи здания (наружные)</span></label>
                <label><input type="radio" name="location" value="inside" checked={location === 'inside'} onChange={(e) => setLocation(e.target.value)} /> <span>Внутри здания (внутренние)</span></label>
              </div>
            </div>

            {location === 'outside' && (
              <div className="form-group">
                <span className="form-group-title">2. Укажите габариты фасада</span>
                <div className="input-group">
                  <div className="input-field"><label>Длина (L), м</label><input type="number" name="length" value={inputs.length} onChange={handleInputChange} /></div>
                  <div className="input-field"><label>Высота (H), м</label><input type="number" name="height" value={inputs.height} onChange={handleInputChange} /></div>
                </div>
              </div>
            )}
            
            {location === 'inside' && (
               <div className="form-group">
                <span className="form-group-title">2. Для каких работ?</span>
                 <div className="options-group">
                    <label><input type="radio" name="inside-type" value="ceiling" checked={insideType === 'ceiling'} onChange={(e) => setInsideType(e.target.value)} /> <span>Для работ с потолком (сплошной настил)</span></label>
                    <label><input type="radio" name="inside-type" value="walls" checked={insideType === 'walls'} onChange={(e) => setInsideType(e.target.value)} /> <span>Только для работ со стенами</span></label>
                 </div>
               </div>
            )}
            
            {location === 'inside' && insideType === 'ceiling' && (
                 <div className="form-group">
                   <span className="form-group-title">3. Укажите габариты помещения</span>
                   <div className="input-group">
                     <div className="input-field"><label>Длина (Lпом), м</label><input type="number" name="roomLength" value={inputs.roomLength} onChange={handleInputChange}/></div>
                     <div className="input-field"><label>Ширина (Wпом), м</label><input type="number" name="roomWidth" value={inputs.roomWidth} onChange={handleInputChange}/></div>
                   </div>
                 </div>
            )}

            {location === 'inside' && insideType === 'walls' && (
                 <div className="form-group">
                   <span className="form-group-title">3. Укажите параметры</span>
                    <div className="input-group">
                     <div className="input-field"><label>Длина стен (Lстен), м</label><input type="number" name="wallsLength" value={inputs.wallsLength} onChange={handleInputChange}/></div>
                     <div className="input-field"><label>Ширина настила (Wн), м</label><input type="number" name="scaffoldWidth" value={inputs.scaffoldWidth} onChange={handleInputChange}/></div>
                   </div>
                 </div>
            )}
            
            <button type="submit" disabled={loading} style={{width: '100%', padding: '15px', fontSize: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
          </form>

          {error && <div className="calc-result" style={{borderColor: '#ffb3b3', background: '#fff8f8'}}><p style={{color: '#b30000', textAlign: 'center'}}>{error}</p></div>}
          
          {result && (
            <div className="calc-result">
              <div className="result-title">Расчетный объем работ:</div>
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
```

---

### Шаг 3: Отправьте Все Изменения на GitHub

Теперь, когда у вас есть оба исправленных файла, вам нужно отправить финальную версию "чертежей" в наш "архив".

1.  **Для бэкенда (папка `smetnoe-backend`):**
    ```bash
    git add .
    git commit -m "fix: Улучшена обработка ошибок при выдаче токена"
    git push
    ```
2.  **Для фронтенда (папка `smetnoe-frontend`):**
    ```bash
    git add .
    git commit -m "fix: Исправлена логика кнопки расчета и ошибок"
    git push
    

