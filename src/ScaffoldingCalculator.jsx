import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Packer, Document, Paragraph, TextRun } from 'docx';

// Это наш компонент калькулятора. Вся его логика и внешний вид описаны здесь.
function ScaffoldingCalculator() {
  // --- "Записные книжки" (State) для хранения данных ---
  const [location, setLocation] = useState('outside');
  const [insideType, setInsideType] = useState('ceiling');
  const [inputs, setInputs] = useState({
    height: '',
    length: '',
    roomWidth: '',
    roomLength: '',
    scaffoldWidth: '',
    wallsLength: ''
  });
  
  // Токен теперь всегда считывается из локального хранилища при загрузке
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  // --- Критическое ИСПРАВЛЕНИЕ: Автоматический прием и сохранение токена ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем токен в localStorage, чтобы он не терялся при перезагрузке
      localStorage.setItem('accessToken', tokenFromUrl); 
      
      // Выводим сообщение об успехе (заменили alert на более мягкий способ вывода)
      setError(`Доступ получен! Ваш токен сохранен и готов к работе.`);

      // Очищаем URL, чтобы токен не оставался видимым
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Проверяем, вернулась ли ошибка от бэкенда при перенаправлении
    const errorFromUrl = urlParams.get('error');
    if (errorFromUrl) {
        setError(`Ошибка доступа: ${errorFromUrl}`);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
  }, []); 


  // --- Обработчики действий пользователя ---

  // Обработчик изменения значений в полях ввода
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    // Убедимся, что токен существует перед отправкой
    if (!token) {
      setError('Пожалуйста, введите ваш токен доступа или получите новый через Telegram-бота.');
      setLoading(false);
      return;
    }
    
    // Собираем данные для отправки на сервер
    const requestData = {
      token,
      data: {
        location,
        insideType: location === 'inside' ? insideType : null,
        ...inputs
      }
    };

    // Адрес API должен быть задан в Vercel в переменной REACT_APP_API_URL
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${apiUrl}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        // Если токен истек, очищаем его, чтобы пользователь получил новый
        if (data.message.includes('истекший токен')) {
            localStorage.removeItem('accessToken');
            setToken('');
        }
        setError(data.message || 'Произошла неизвестная ошибка.');
      }
    } catch (err) {
      setError('Не удалось связаться с сервером. Проверьте ваше интернет-соединение.');
    } finally {
      setLoading(false);
    }
  };
    
  // Функция для экспорта в Word (не менялась)
  const exportToWord = () => {
    if (!result) return;
    // Логика экспорта... (опущена для краткости)
    // ...
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "Результат расчета объема работ по лесам", bold: true, size: 32 })],
                }),
                new Paragraph({ text: `Объем работ (V): ${result.volume} м²` }),
                new Paragraph({ text: `Формула расчета: ${result.formula}` }),
                ...result.formulaBreakdown.map(line => new Paragraph({ text: `- ${line}` })),
                 result.coefficient ? new Paragraph({ 
                    children: [
                        new TextRun({ text: "Повышающий коэффициент (K): ", bold: true }),
                        new TextRun({ text: `${result.coefficient.value}. ${result.coefficient.explanation}` })
                    ]
                }) : new Paragraph({}),
                result.coefficient ? new Paragraph({ text: `Формула коэффициента: ${result.coefficient.formula}`}) : new Paragraph({}),
                 new Paragraph({
                    children: [new TextRun({ text: "Обоснование:", bold: true })]
                }),
                new Paragraph({
                    children: [new TextRun({ text: result.justification.title, bold: true })]
                }),
                new Paragraph({
                    text: result.justification.text
                }),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, "Расчет_лесов.docx");
    });
};


  return (
    <>
    <style>{`
        /* Стили Tailwind-подобные классы для современного вида */
        .scaffolding-calculator { font-family: 'Inter', sans-serif; max-width: 700px; margin: 2rem auto; border-radius: 15px; overflow: hidden; box-shadow: 0 6px 25px rgba(0, 43, 85, 0.1); border: 1px solid #e0e7ff; background-color: #ffffff; }
        .calc-header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #fff; padding: 20px 25px; text-align: center; }
        .calc-header h2 { margin: 0; font-size: 24px; }
        .calc-body { padding: 25px 30px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 16px; font-weight: 500; margin-bottom: 8px; color: #334155; }
        .form-group input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; transition: border-color 0.2s, box-shadow 0.2s; }
        .form-group input:focus { border-color: #007bff; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2); outline: none; }
        .radio-group { display: flex; gap: 15px; margin-bottom: 20px; }
        .radio-group label { display: flex; align-items: center; cursor: pointer; padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px; transition: all 0.2s; }
        .radio-group input { display: none; }
        .radio-group input:checked + label { background-color: #e0f2fe; border-color: #007bff; color: #0056b3; font-weight: 500; }
        .btn { display: block; width: 100%; padding: 14px; background-color: #007bff; color: #fff; border: none; border-radius: 8px; font-size: 18px; font-weight: 500; cursor: pointer; transition: background-color 0.2s, transform 0.1s; }
        .btn:hover:not(:disabled) { background-color: #0056b3; }
        .btn:active:not(:disabled) { transform: translateY(1px); }
        .btn:disabled { background-color: #a0c3e6; cursor: not-allowed; }
        .result-block { margin-top: 30px; padding: 20px; border-radius: 8px; background-color: #f8f9fa; border: 1px solid #e9ecef; }
        .result-block.error-block { background-color: #fff5f5; border-color: #fecaca; color: #b91c1c; }
        .result-value { font-size: 28px; font-weight: bold; color: #0056b3; margin-bottom: 15px; }
        .result-details code { background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', Courier, monospace; }
        .formula-breakdown { margin-top: 10px; padding-left: 20px; }
        .coefficient-block { margin-top: 15px; padding: 10px; background-color: #fff9e6; border: 1px solid #ffeeba; border-radius: 5px; }
        .token-input-group { margin-bottom: 20px; }
        .export-buttons { margin-top: 20px; display: flex; gap: 10px; }
        .btn-export { padding: 10px 15px; border: none; border-radius: 5px; color: #fff; cursor: pointer; font-weight: 500; }
        .btn-word { background-color: #2b579a; }
        .accordion-header { background: none; border: none; text-align: left; padding: 10px 0; font-size: 16px; width: 100%; cursor: pointer; border-top: 1px solid #eee; margin-top: 15px; }
        .accordion-content { overflow: hidden; transition: max-height 0.3s ease; }
    `}</style>
      <div className="scaffolding-calculator">
        <div className="calc-header">
          <h2>Калькулятор объема работ по лесам</h2>
        </div>
        <div className="calc-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group token-input-group">
                <label>Токен доступа</label>
                {/* Токен будет отображаться здесь, если он был сохранен */}
                <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Введите ваш токен доступа" required />
            </div>

            <div className="form-group">
              <label>Место установки лесов</label>
              <div className="radio-group">
                <input type="radio" id="outside" name="location" value="outside" checked={location === 'outside'} onChange={() => setLocation('outside')} />
                <label htmlFor="outside">Снаружи здания</label>
                <input type="radio" id="inside" name="location" value="inside" checked={location === 'inside'} onChange={() => setLocation('inside')} />
                <label htmlFor="inside">Внутри здания</label>
              </div>
            </div>

            {location === 'outside' && (
              <>
                <div className="form-group">
                  <label>Высота лесов (H), м</label>
                  <input type="number" step="0.01" name="height" value={inputs.height} onChange={handleInputChange} placeholder="например, 20" required />
                </div>
                <div className="form-group">
                  <label>Длина лесов (L), м</label>
                  <input type="number" step="0.01" name="length" value={inputs.length} onChange={handleInputChange} placeholder="например, 50" required />
                </div>
              </>
            )}

            {location === 'inside' && (
              <>
                <div className="form-group">
                  <label>Тип работ внутри</label>
                  <div className="radio-group">
                    <input type="radio" id="ceiling" name="insideType" value="ceiling" checked={insideType === 'ceiling'} onChange={() => setInsideType('ceiling')} />
                    <label htmlFor="ceiling">Потолок</label>
                    <input type="radio" id="walls" name="insideType" value="walls" checked={insideType === 'walls'} onChange={() => setInsideType('walls')} />
                    <label htmlFor="walls">Стены</label>
                  </div>
                </div>
                {insideType === 'ceiling' && (
                  <>
                    <div className="form-group">
                      <label>Длина помещения (Lпом), м</label>
                      <input type="number" step="0.01" name="roomLength" value={inputs.roomLength} onChange={handleInputChange} placeholder="например, 12" required />
                    </div>
                    <div className="form-group">
                      <label>Ширина помещения (Wпом), м</label>
                      <input type="number" step="0.01" name="roomWidth" value={inputs.roomWidth} onChange={handleInputChange} placeholder="например, 8" required />
                    </div>
                  </>
                )}
                {insideType === 'walls' && (
                  <>
                    <div className="form-group">
                      <label>Общая длина стен (Lстен), м</label>
                      <input type="number" step="0.01" name="wallsLength" value={inputs.wallsLength} onChange={handleInputChange} placeholder="например, 36" required />
                    </div>
                    <div className="form-group">
                      <label>Ширина настила лесов (Wнастила), м</label>
                      <input type="number" step="0.01" name="scaffoldWidth" value={inputs.scaffoldWidth} onChange={handleInputChange} placeholder="например, 1.5" required />
                    </div>
                  </>
                )}
              </>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
          </form>

          {error && <div className="result-block error-block"><p>{error}</p></div>}
          
          {result && (
            <div className="result-block">
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
