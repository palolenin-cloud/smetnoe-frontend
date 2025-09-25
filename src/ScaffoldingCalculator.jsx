// --- Подключение зависимостей ---
// Импортируем "строительные блоки" из библиотеки React.
// 'React' - это основной "инженер", который знает, как строить интерфейсы.
// 'useState', 'useEffect' - это его "инструменты" для управления данными и выполнения действий в нужный момент.
import React, { useState, useEffect } from 'react';

// --- Стили ---
// Мы помещаем стили прямо в компонент. Это современный подход, называемый CSS-in-JS.
// Аналогия: Вместо того чтобы клеить обои (CSS) из отдельного рулона, мы создаем "умные" стены,
// которые уже знают, какого цвета им быть. Все, что касается внешнего вида, лежит в одном месте.
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

// --- Основной Компонент Калькулятора ---
// Функция ScaffoldingCalculator - это "чертеж" нашего калькулятора.
// React использует этот чертеж, чтобы построить интерактивный элемент на странице.
function ScaffoldingCalculator() {
  // --- "Записные книжки" (Состояние / State) ---
  // useState - это специальный "инструмент" React, который создает "записную книжку с волшебным карандашом".
  // Когда мы что-то пишем в эту книжку (например, `setLocation('inside')`), React это видит и автоматически
  // перерисовывает те части интерфейса, которые зависят от этой записи.
  
  // Книжка для хранения выбора "где ставим леса" ('outside' или 'inside').
  const [location, setLocation] = useState(''); 
  // Книжка для хранения выбора типа внутренних работ ('ceiling' или 'walls').
  const [insideType, setInsideType] = useState('');
  // Книжка (в виде объекта) для хранения всех числовых значений из полей ввода.
  const [inputs, setInputs] = useState({
    height: '', length: '', roomWidth: '',
    roomLength: '', scaffoldWidth: '', wallsLength: ''
  });
  // Книжка для хранения токена доступа пользователя.
  const [token, setToken] = useState('');
  // Книжка для хранения ПОЛНОГО ответа от сервера в случае успеха.
  const [result, setResult] = useState(null);
  // Книжка для хранения текста ошибки, если что-то пошло не так.
  const [error, setError] = useState('');
  // Книжка-переключатель (true/false), которая говорит, идет ли сейчас загрузка.
  const [loading, setLoading] = useState(false);
  // Книжка-переключатель для нашего аккордеона с обоснованием (открыт/закрыт).
  const [accordionOpen, setAccordionOpen] = useState(false);


  // --- "Умный наблюдатель" (Эффект / useEffect) ---
  // useEffect - это "наблюдатель", который выполняет какое-то действие при определенных условиях.
  // В данном случае, он срабатывает ОДИН РАЗ (благодаря пустому списку `[]` в конце)
  // сразу после того, как калькулятор впервые появится на экране.
  useEffect(() => {
    // Он "осматривает" адресную строку браузера в поисках параметра 'token'.
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    // Если токен найден...
    if (tokenFromUrl) {
      // ...он "записывает" его в нашу "записную книжку" 'token'.
      setToken(tokenFromUrl);
      // И сразу же "стирает" его из адресной строки, чтобы он не мешался.
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Пустой массив `[]` означает "сделай это только один раз при рождении компонента".


  // --- "Инструкции для помощников" (Обработчики / Handlers) ---
  
  // Инструкция, которая срабатывает каждый раз, когда пользователь что-то печатает в числовом поле.
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Узнаем имя поля (например, 'height') и новое значение.
    // Обновляем нашу "книжку" с полями ввода, изменяя только то поле, которое нужно.
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // Главная инструкция - запуск расчета. Она срабатывает при клике на кнопку "Рассчитать".
  const runCalculation = async () => {
    // Предварительные проверки: не запускаем расчет, если не сделан основной выбор.
    if (!location || (location === 'inside' && !insideType)) {
      setResult(null);
      return; // Прерываем выполнение инструкции.
    }
    
    // "Прибираемся на столе" перед началом работы: очищаем старый результат и ошибки.
    setResult(null);
    setError('');
    setLoading(true); // Включаем режим "загрузка".

    // Проверяем наличие токена.
    if (!token) {
      setError('Пожалуйста, введите ваш токен доступа.');
      setLoading(false); // Выключаем режим "загрузка", так как расчет невозможен.
      return;
    }

    // Собираем все данные в один "пакет" для отправки на сервер.
    let dataToSend = { location, insideType, ...inputs };

    try {
      // Определяем адрес нашего "мозга" (бэкенда).
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      // "Звоним" на сервер по нужному "внутреннему номеру" (/api/calculate/scaffolding).
      const response = await fetch(`${apiUrl}/api/calculate/scaffolding`, {
        method: 'POST', // Метод "POST" - мы ПЕРЕДАЕМ данные.
        headers: {
          'Content-Type': 'application/json', // Говорим, что данные в формате JSON.
          'Authorization': token // Предъявляем наш "пропуск" (токен).
        },
        body: JSON.stringify(dataToSend) // Превращаем наш "пакет" в строку для отправки.
      });
      
      const responseData = await response.json(); // Читаем ответ от сервера.
      
      // Если сервер ответил, что все хорошо (`success: true`)...
      if (responseData.success) {
        setResult(responseData); // ...записываем ВЕСЬ его ответ в "книжку" с результатами.
      } else {
        // ...иначе записываем его сообщение об ошибке.
        setError(responseData.message || 'Произошла неизвестная ошибка');
      }
    } catch (err) {
      // Если мы даже не смогли "дозвониться" до сервера.
      setError('Не удалось связаться с сервером.');
    } finally {
      // Этот блок выполняется ВСЕГДА, и при успехе, и при ошибке.
      setLoading(false); // Выключаем режим "загрузка".
    }
  };

  // --- "Мастера-оформители" (Функции для экспорта) ---
  
  // Эта функция-помощник готовит HTML-код для экспорта.
  const generateExportContent = () => {
    if (!result) return ''; // Если результата нет, ничего не делаем.
    // Собираем красивую HTML-строку из данных, хранящихся в "книжке" result.
    let content = '<h1>Расчет объема строительных лесов</h1>';
    content += `<h2>Исходные данные:</h2><ul>`;
    content += `<li><strong>Расположение:</strong> ${location === 'outside' ? 'Снаружи здания' : 'Внутри здания'}</li>`;
    content += '</ul>';
    content += '<h2>Результаты расчета:</h2>';
    content += `<p><strong>Расчетный объем работ: ${result.volume} м²</strong></p>`;
    // ... и так далее, используя все данные из `result`.
    if(result.formula) { content += `<p><strong>Формула расчета:</strong> <code>${result.formula}</code></p>`; }
    if(result.formulaBreakdown) { content += `<ul>${result.formulaBreakdown.map(line => `<li>${line}</li>`).join('')}</ul>`; }
    if(result.coefficient) { content += `<p><strong>${result.coefficient.explanation}</strong></p><p>Формула коэффициента: <code>${result.coefficient.formula}</code></p>`; }
    if(result.justification) { content += `<h2>Обоснование:</h2><p><strong>${result.justification.title}:</strong></p><blockquote>${result.justification.text}</blockquote>`; }
    return content;
  }

  // Инструкция для экспорта в Word.
  const exportToWord = () => {
    const content = generateExportContent(); // Получаем готовый HTML.
    // "Заворачиваем" его в специальную обертку, чтобы Word понял, что это документ.
    const sourceHTML = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Расчет</title></head><body>${content}</body></html>`;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    // Создаем невидимую ссылку и "кликаем" по ней, чтобы браузер начал скачивание файла.
    const fileDownload = document.createElement("a");
    fileDownload.href = source;
    fileDownload.download = 'raschet-lesov.doc';
    fileDownload.click();
  };
  
  // --- "Сборочный цех" (Рендер / return) ---
  // Здесь мы описываем, КАК должен выглядеть наш калькулятор, используя язык JSX (похож на HTML).
  // React берет этот "чертеж" и строит из него реальные элементы на странице.
  return (
    <> {/* Это "фрагмент", невидимая обертка, чтобы вернуть несколько элементов сразу. */}
      {/* Внедряем наши стили прямо на страницу. */}
      <style>{styles}</style>
      
      {/* Основной контейнер калькулятора */}
      <div className="scaffolding-calculator">
        <div className="calc-header">
          <h2>Калькулятор объема строительных лесов</h2>
        </div>
        <div className="calc-body">
          {/* Мы используем <form>, но отключаем его стандартное поведение, чтобы страница не перезагружалась. */}
          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* Поле для ввода токена */}
            <div className="form-group">
                <label className="form-group-title">Токен доступа</label>
                <input
                    type="text"
                    value={token} // Значение этого поля всегда равно тому, что записано в "книжке" 'token'.
                    onChange={(e) => setToken(e.target.value)} // При любой печати - обновляем "книжку" 'token'.
                    placeholder="Вставьте токен, полученный от бота"
                    style={{width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                />
            </div>
            
            {/* ... другие поля и кнопки ... */}
             <div className="form-group">
              <span className="form-group-title">1. Где будут устанавливаться леса?</span>
              <div className="options-group">
                <label><input type="radio" name="location" value="outside" onChange={(e) => setLocation(e.target.value)} /> <span>Снаружи здания (наружные)</span></label>
                <label><input type="radio" name="location" value="inside" onChange={(e) => setLocation(e.target.value)} /> <span>Внутри здания (внутренние)</span></label>
              </div>
            </div>

            {/* === УСЛОВНЫЙ РЕНДЕРИНГ === */}
            {/* Эта конструкция означает: "Показывай следующий блок ТОЛЬКО ЕСЛИ в 'книжке' location записано 'outside'". */}
            {location === 'outside' && (
              <div className="form-group">
                <span className="form-group-title">2. Укажите габариты фасада</span>
                <div className="input-group">
                  <div className="input-field"><label>Длина (L), м</label><input type="number" name="length" value={inputs.length} onChange={handleInputChange} /></div>
                  <div className="input-field"><label>Высота (H), м</label><input type="number" name="height" value={inputs.height} onChange={handleInputChange} /></div>
                </div>
              </div>
            )}
            
            {/* Аналогично, показываем этот блок только для внутренних работ. */}
            {location === 'inside' && (
               <div className="form-group">
                 {/* ... (содержимое блока для внутренних работ) ... */}
               </div>
            )}
            
            <button onClick={runCalculation} disabled={loading} style={{width: '100%', padding: '15px', fontSize: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
                {/* Текст на кнопке зависит от состояния 'loading'. */}
                {loading ? 'Расчет...' : 'Рассчитать'}
            </button>
            
          </form>

          {/* Показываем блок с ошибкой, ТОЛЬКО ЕСЛИ в "книжке" 'error' что-то записано. */}
          {error && <div className="calc-result" style={{borderColor: '#ffb3b3', background: '#fff8f8'}}><p style={{color: '#b30000', textAlign: 'center'}}>{error}</p></div>}
          
          {/* Показываем блок с результатом, ТОЛЬКО ЕСЛИ в "книжке" 'result' что-то записано. */}
          {result && (
            <div className="calc-result">
              <div className="result-title">Расчетный объем работ:</div>
              <div className="result-value">{result.volume} м²</div>
              <div className="result-details">
                  {/* ... (здесь мы выводим все данные из объекта 'result') ... */}
                  <p>Формула расчета: <code>{result.formula}</code></p>
                  <div className="formula-breakdown">
                    <p>где:</p>
                    {/* `map` - это способ превратить массив строк в список элементов `<li>` */}
                    <ul>{result.formulaBreakdown.map((line, i) => <li key={i}>{line}</li>)}</ul>
                  </div>
                  
                  {/* Показываем блок с коэффициентом, только если он есть в ответе сервера. */}
                  {result.coefficient && (
                    <div className="coefficient-block">
                      {/* ... (данные коэффициента) ... */}
                    </div>
                  )}
                  
                  {/* Аккордеон */}
                  <button type="button" className="accordion-header" onClick={() => setAccordionOpen(!accordionOpen)}>
                      <strong>Обоснование:</strong> {result.justification.title}
                  </button>
                  {/* Стиль max-height меняется в зависимости от "книжки" accordionOpen, создавая эффект анимации. */}
                  <div className="accordion-content" style={{maxHeight: accordionOpen ? '200px' : '0'}}>
                      <p>{result.justification.text}</p>
                  </div>
                  
                  {/* Кнопки экспорта */}
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

// Экспортируем наш "чертеж", чтобы другие части приложения могли его использовать.
export default ScaffoldingCalculator;