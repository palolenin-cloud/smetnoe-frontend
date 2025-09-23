import React, { useState, useEffect } from 'react';

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
  
  // Новые "записные книжки" для работы с платной системой
  const [token, setToken] = useState(''); // Для хранения токена доступа
  const [result, setResult] = useState(null); // Для хранения успешного результата
  const [error, setError] = useState(''); // Для хранения сообщений об ошибках
  const [loading, setLoading] = useState(false); // Для отслеживания состояния загрузки

  // Эффект для автоматического получения токена из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Очищаем URL, чтобы токен не оставался видимым
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


  // --- Обработчики событий ---

  // Эта функция вызывается, когда пользователь вводит что-то в поля
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  // Эта функция - "телефонный звонок" на наш бэкенд
  const handleSubmit = async (e) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы (перезагрузку страницы)
    
    // Очищаем старые результаты и ошибки
    setResult(null);
    setError('');
    setLoading(true);

    // Проверяем, ввел ли пользователь токен
    if (!token) {
        setError('Пожалуйста, введите ваш токен доступа или получите новый через Telegram-бота.');
        setLoading(false);
        return;
    }

    // Собираем данные для отправки в зависимости от выбранных опций
    let dataToSend = { location, insideType };
    if (location === 'outside') {
      dataToSend.height = inputs.height;
      dataToSend.length = inputs.length;
    } else {
      if (insideType === 'ceiling') {
        dataToSend.roomWidth = inputs.roomWidth;
        dataToSend.roomLength = inputs.roomLength;
      } else {
        dataToSend.scaffoldWidth = inputs.scaffoldWidth;
        dataToSend.wallsLength = inputs.wallsLength;
      }
    }

    try {
      // Определяем адрес нашего бэкенда.
      // process.env.REACT_APP_API_URL - это специальная переменная, 
      // которую мы настроим при развертывании. Локально она будет пустой.
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

      // Отправляем запрос на сервер
      const response = await fetch(`${apiUrl}/api/calculate/scaffolding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ВАЖНО: Добавляем наш токен в заголовок Authorization.
          // Это и есть наш "пропуск".
          'Authorization': token 
        },
        body: JSON.stringify(dataToSend)
      });
      
      const responseData = await response.json();

      if (responseData.success) {
        setResult(responseData); // Если все хорошо, сохраняем результат
      } else {
        setError(responseData.message || 'Произошла неизвестная ошибка'); // Если сервер вернул ошибку, сохраняем ее текст
      }

    } catch (err) {
      console.error('Ошибка при отправке запроса:', err);
      setError('Не удалось связаться с сервером. Пожалуйста, убедитесь, что он запущен, и попробуйте позже.');
    } finally {
        setLoading(false);
    }
  };

  // --- Внешний вид компонента (то, что видит пользователь) ---
  return (
    <div className="calculator-container">
      <h2>Калькулятор объема строительных лесов</h2>
      <p className="description">Для получения доступа к калькулятору, пожалуйста, приобретите временный токен через нашего Telegram-бота.</p>
      
      <form onSubmit={handleSubmit}>
        {/* Поле для ввода токена */}
        <div className="form-group">
            <label htmlFor="token">Ваш токен доступа</label>
            <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Вставьте токен, полученный после оплаты"
                required
            />
        </div>

        {/* Остальная часть формы */}
        <div className="form-group">
          <label>Место установки</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="outside">Снаружи здания</option>
            <option value="inside">Внутри здания</option>
          </select>
        </div>

        {location === 'outside' && (
          <>
            <div className="form-group">
              <label>Высота фасада (H), м</label>
              <input type="number" step="0.01" name="height" value={inputs.height} onChange={handleInputChange} placeholder="например, 25" required />
            </div>
            <div className="form-group">
              <label>Длина фасада (L), м</label>
              <input type="number" step="0.01" name="length" value={inputs.length} onChange={handleInputChange} placeholder="например, 40" required />
            </div>
          </>
        )}

        {location === 'inside' && (
          <>
            <div className="form-group">
              <label>Тип работ внутри</label>
              <select value={insideType} onChange={(e) => setInsideType(e.target.value)}>
                <option value="ceiling">Для отделки потолка (сплошной настил)</option>
                <option value="walls">Только для отделки стен (вдоль стен)</option>
              </select>
            </div>
            {insideType === 'ceiling' ? (
              <>
                <div className="form-group">
                  <label>Длина помещения (Lпом), м</label>
                  <input type="number" step="0.01" name="roomLength" value={inputs.roomLength} onChange={handleInputChange} placeholder="например, 10" required />
                </div>
                <div className="form-group">
                  <label>Ширина помещения (Wпом), м</label>
                  <input type="number" step="0.01" name="roomWidth" value={inputs.roomWidth} onChange={handleInputChange} placeholder="например, 8" required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Общая длина стен под отделку (Lстен), м</label>
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

      {/* Блок для вывода результата или ошибки */}
      {error && (
        <div className="result-block error-block">
          <h4>Ошибка</h4>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-block">
          <h3>Результат расчета:</h3>
          <p><strong>Объем работ (V):</strong> {result.volume} м²</p>
          <p><strong>Формула расчета:</strong> <code>{result.formula}</code></p>
          {result.coefficient && (
            <>
              <p><strong>Повышающий коэффициент (K):</strong> {result.coefficient.value}</p>
              <p><strong>Формула коэффициента:</strong> <code>{result.coefficient.formula}</code></p>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default ScaffoldingCalculator;

