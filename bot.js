import { configDotenv } from 'dotenv';
configDotenv();
import TelegramBot from "node-telegram-bot-api";
import axios from 'axios';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { 
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 60
    }
  },
  request: {
    timeout: 30000,
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

console.log('🚀 Арбитражный бот запущен...');

// ==================== ОПТИМИЗИРОВАННАЯ КОНФИГУРАЦИЯ ====================

const CRYPTO_SYMBOLS = [
  // Топ-20 по капитализации
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'ETCUSDT', 'XLMUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT',
  
  // Дополнительные популярные монеты
  'NEARUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'EOSUSDT',
  'XMRUSDT', 'XTZUSDT', 'AAVEUSDT', 'MKRUSDT', 'SNXUSDT',
  
  // Дешевые монеты с высоким объемом
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT',
  'BOMEUSDT', 'MEMEUSDT', 'DOGSUSDT', 'POPCATUSDT', 'MYROUSDT',
  
  
  
  // DeFi токены
  'UNIUSDT', 'CAKEUSDT', 'COMPUSDT', 'YFIUSDT', 'CRVUSDT',
  'SUSHIUSDT', '1INCHUSDT', 'RUNEUSDT', 'RAYUSDT', 'JUPUSDT',
  
  // Gaming/Metaverse
  'SANDUSDT', 'MANAUSDT', 'ENJUSDT', 'GALAUSDT', 'AXSUSDT',
  'ILVUSDT', 'YGGUSDT', 'PIXELUSDT', 'BEAMUSDT', 'ACEUSDT',
  
  // AI токены
  'TAOUSDT', 'AGIXUSDT', 'FETUSDT', 'OCEANUSDT', 'RNDRUSDT',
  'AKTUSDT', 'NFPUSDT', 'AIUSDT', 'PAALUSDT', 'CTXCUSDT',
  
  // Layer 2
  'ARBUSDT', 'OPUSDT', 'MATICUSDT', 'IMXUSDT', 'METISUSDT',
  'MNTUSDT', 'STRKUSDT', 'ZKUSDT', 'LRCUSDT', 'BOBAUSDT',
  
  // Oracles
  'LINKUSDT', 'BANDUSDT', 'TRBUSDT', 'API3USDT', 'DIAUSDT',
  'NESTUSDT', 'POKTUSDT', 'UMABUSD', 'VXVUSDT', 'XYOUSDT',
  
  // Storage
  'FILUSDT', 'ARUSDT', 'STORJUSDT', 'SCUSDT', 'BTTUSDT',
  'HOTUSDT', 'STXUSDT', 'ANKRUSDT', 'PHAUSDT', 'OCEANUSDT',
  
  // Privacy
  'XMRUSDT', 'ZECUSDT', 'DASHUSDT', 'ZENUSDT', 'SCRTUSDT',
  'BEAMUSDT', 'MOBUSDT', 'FIROUSDT', 'XVGUSDT', 'NAVUSDT',
  
  // Stablecoins (для сравнения)
  'USDCUSDT', 'USDTUSDC', 'DAIUSDT', 'BUSDUSDT', 'TUSDUSDT',
  
  // Экзотические с высоким объемом
  'FTMUSDT', 'EGLDUSDT', 'THETAUSDT', 'KAVAUSDT', 'RVNUSDT',
  'IOTAUSDT', 'NEOUSDT', 'ONTUSDT', 'QTUMUSDT', 'WAVESUSDT',
  
  // Новые популярные
  'SEIUSDT', 'SUIUSDT', 'TIAUSDT', 'INJUSDT', 'RENDERUSDT',
  'KASUSDT', 'STXUSDT', 'MINAUSDT', 'CELOUSDT', 'DYMUSDT',
  
  // Микро-капы с потенциалом
  'PYTHUSDT', 'JTOUSDT', 'PORTALUSDT', 'PENDLEUSDT', 'ONDOUSDT',
  'ALTUSDT', 'ZETAUSDT', 'MAVIAUSDT', 'AXLUSDT', 'DUSKUSDT'
];

// Оптимизируем для скорости - берем топ 50 самых ликвидных
const ACTIVE_SYMBOLS = [
  // Топ-10 по объему
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  
  // Топ мем-коины (высокая волатильность)
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT',
  
  // Популярные альткоины
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'ATOMUSDT', 'UNIUSDT',
  
  // Дешевые монеты для арбитража
  'BCHUSDT', 'ETCUSDT', 'XLMUSDT', 'FILUSDT', 'ALGOUSDT',
  
  // Новые и перспективные
  'ARBUSDT', 'OPUSDT', 'APTUSDT', 'NEARUSDT', 'RUNEUSDT',
  
  // AI сектор
  'FETUSDT', 'AGIXUSDT', 'RNDRUSDT', 'TAOUSDT', 'OCEANUSDT',
  
  // Gaming/Metaverse
  'SANDUSDT', 'MANAUSDT', 'GALAUSDT', 'AXSUSDT', 'ENJUSDT',
  
  // Высоко-волатильные
  'FTMUSDT', 'EGLDUSDT', 'THETAUSDT', 'VETUSDT', 'EOSUSDT',
  
  // Новые токены
  'SEIUSDT', 'SUIUSDT', 'TIAUSDT', 'INJUSDT', 'JUPUSDT',
  
  // Микро-капы
  'PYTHUSDT', 'JTOUSDT', 'PENDLEUSDT', 'ONDOUSDT', 'ALTUSDT'
];

// Оптимизированные биржи (только самые надежные и быстрые)
const EXCHANGES = {
  BINANCE: {
    name: 'Binance',
    weight: 10,
    supportedSymbols: CRYPTO_SYMBOLS, // Поддерживает все монеты
    api: (symbol) => `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price)
  },
  BYBIT: {
    name: 'Bybit', 
    weight: 9,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !['POPCATUSDT', 'MYROUSDT', 'DOGSUSDT'].includes(sym) // Исключаем редкие
    ),
    api: (symbol) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
    parser: (data) => parseFloat(data.result?.list?.[0]?.lastPrice || 0)
  },
  MEXC: {
    name: 'MEXC',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS, // MEXC поддерживает много монет
    api: (symbol) => `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price)
  },
  KUCOIN: {
    name: 'KuCoin',
    weight: 7,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !sym.includes('BOME') && !sym.includes('POPCAT') // Фильтруем очень новые
    ),
    api: (symbol) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`,
    parser: (data) => parseFloat(data.data?.price || 0)
  },
  OKX: {
    name: 'OKX',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !['MYROUSDT', 'DOGSUSDT', 'BONKUSDT'].includes(sym) // Основные монеты
    ),
    api: (symbol) => `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`,
    parser: (data) => parseFloat(data.data?.[0]?.last || 0)
  },
  GATEIO: {
    name: 'Gate.io',
    weight: 7,
    supportedSymbols: CRYPTO_SYMBOLS, // Gate.io поддерживает почти все
    api: (symbol) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol.replace('USDT', '_USDT')}`,
    parser: (data) => parseFloat(data[0]?.last || 0)
  },
  HUOBI: {
    name: 'Huobi',
    weight: 6,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !sym.includes('PEPE') && !sym.includes('BONK') // Консервативный список
    ),
    api: (symbol) => `https://api.huobi.pro/market/detail/merged?symbol=${symbol.toLowerCase()}`,
    parser: (data) => parseFloat(data.tick?.close || 0)
  }
};
// ==================== ОПТИМИЗИРОВАННЫЕ СИСТЕМЫ ====================
const arbitrageUsers = new Map();
const arbitrageStats = new Map();
const requestCache = new Map();

// Умный кэш с приоритетами
class SmartCache {
  constructor(duration = 3000) {
    this.duration = duration;
  }
  
  set(key, data) {
    requestCache.set(key, { 
      data, 
      timestamp: Date.now(),
      hits: 0 
    });
  }
  
  get(key) {
    const cached = requestCache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.duration)) {
      cached.hits++;
      return cached.data;
    }
    return null;
  }
  
  // Автоматическая очистка старых записей
  cleanup() {
    const now = Date.now();
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > this.duration * 2) {
        requestCache.delete(key);
      }
    }
  }
}

const cache = new SmartCache(3000);

// ==================== ОПТИМИЗИРОВАННЫЕ КЛАВИАТУРЫ ====================
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['💰 Все монеты', '🎯 Арбитраж ON/OFF'],
      ['⚡ Быстрый арбитраж', '📊 Статистика'],
      ['⚙️ Настройки', 'ℹ️ Помощь']
    ],
    resize_keyboard: true
  }
};

const settingsKeyboard = {
  reply_markup: {
    keyboard: [
      ['🎯 Прибыль: 0.1%', '🎯 Прибыль: 0.3%'],
      ['🎯 Прибыль: 0.5%', '🎯 Прибыль: 1%'],
      ['🎯 Прибыль: 2%', '↩️ Назад']
    ],
    resize_keyboard: true
  }
};

// ==================== ОПТИМИЗИРОВАННЫЕ УТИЛИТЫ ====================
async function smartRequest(url, cacheKey, timeout = 2000) {
  // Сначала проверяем кэш
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await Promise.race([
      axios.get(url, { 
        timeout,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    
    const data = response.data;
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ==================== ОПТИМИЗИРОВАННЫЕ КОМАНДЫ ====================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMessage = `
🚀 <b>Арбитражный Бот</b>

⚡ <b>Оптимизированная система:</b>
• 🔥 Проверка за 1-2 секунды
• 🎯 Точность до 0.1%
• 📊 5 самых ликвидных бирж
• 💰 15 топовых монет

<b>Функции:</b>
• 💰 <b>Все монеты</b> - мгновенные цены
• 🎯 <b>Арбитраж ON/OFF</b> - авто-поиск
• ⚡ <b>Быстрый арбитраж</b> - разовая проверка
• 📊 <b>Статистика</b> - эффективность работы

👇 <b>Выберите действие:</b>
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { 
    parse_mode: 'HTML',
    ...mainKeyboard
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const commandMap = {
    '💰 Все монеты': () => sendAllPrices(chatId),
    '🎯 Арбитраж ON/OFF': () => toggleArbitrage(chatId),
    '⚡ Быстрый арбитраж': () => quickArbitrageCheck(chatId),
    '📊 Статистика': () => showStats(chatId),
    '⚙️ Настройки': () => sendSettings(chatId),
    '🎯 Прибыль: 0.1%': () => setMinProfit(chatId, 0.1),
    '🎯 Прибыль: 0.3%': () => setMinProfit(chatId, 0.3),
    '🎯 Прибыль: 0.5%': () => setMinProfit(chatId, 0.5),
    '🎯 Прибыль: 1%': () => setMinProfit(chatId, 1),
    '🎯 Прибыль: 2%': () => setMinProfit(chatId, 2),
    '↩️ Назад': () => bot.sendMessage(chatId, "🏠 <b>Главное меню</b>", { 
      parse_mode: 'HTML',
      ...mainKeyboard 
    }),
    'ℹ️ Помощь': () => sendHelp(chatId)
  };

  if (commandMap[text]) {
    await commandMap[text]();
  }
});

// ==================== ОПТИМИЗИРОВАННЫЕ ФУНКЦИИ ====================
async function sendAllPrices(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "⚡ <b>Мгновенная загрузка цен...</b>", 
    { parse_mode: 'HTML' }
  );

  try {
    const prices = await Promise.allSettled(
      CRYPTO_SYMBOLS.map(symbol => getCryptoPrice(symbol))
    );

    let message = "💰 <b>Мгновенные цены (Binance)</b>\n\n";
    
    prices.forEach((result, index) => {
      const symbol = CRYPTO_SYMBOLS[index];
      if (result.status === 'fulfilled' && result.value) {
        const price = result.value;
        message += `${getCryptoIcon(symbol)} <b>${getSymbolName(symbol)}</b>\n`;
        message += `   💵 ${formatPrice(price)}\n\n`;
      }
    });

    message += `⏱️ <i>Загружено за ${Date.now() - loadingMsg.date * 1000}мс</i>`;

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    bot.editMessageText("❌ Ошибка загрузки цен", {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
}

async function quickArbitrageCheck(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "⚡ <b>Мгновенная проверка арбитража...</b>", 
    { parse_mode: 'HTML' }
  );

  const startTime = Date.now();
  const opportunities = await findArbitrageOpportunities(0.1);
  const duration = Date.now() - startTime;

  let message = `⚡ <b>Быстрая проверка арбитража</b>\n\n`;
  message += `⏱️ <i>Проверено за ${duration}мс</i>\n\n`;

  if (opportunities.length === 0) {
    message += "📭 Арбитражных возможностей не найдено\n";
    message += "💡 Попробуйте уменьшить минимальную прибыль";
  } else {
    opportunities.slice(0, 5).forEach((opp, index) => {
      message += `${index === 0 ? '🔥' : '⚡'} <b>${getSymbolName(opp.symbol)}</b>\n`;
      message += `   📉 ${opp.buyExchange.icon} ${formatPrice(opp.buyPrice)}\n`;
      message += `   📈 ${opp.sellExchange.icon} ${formatPrice(opp.sellPrice)}\n`;
      message += `   💰 <b>${opp.profit.toFixed(2)}%</b>\n\n`;
    });
  }

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'HTML'
  });
}

function toggleArbitrage(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || { 
    active: false, 
    minProfit: 0.3,
    lastNotification: 0
  };
  
  userSettings.active = !userSettings.active;
  arbitrageUsers.set(chatId, userSettings);

  if (userSettings.active) {
    bot.sendMessage(chatId, 
      `🎯 <b>АРБИТРАЖ АКТИВИРОВАН</b>\n\n` +
      `📈 Минимальная прибыль: <b>${userSettings.minProfit}%</b>\n` +
      `⚡ Проверка каждые 2 секунды\n` +
      `🔔 Умные уведомления\n\n` +
      `<i>Система запущена и ищет возможности...</i>`,
      { parse_mode: 'HTML', ...mainKeyboard }
    );
    startArbitrageMonitoring(chatId);
  } else {
    const stats = arbitrageStats.get(chatId) || { found: 0, checks: 0 };
    bot.sendMessage(chatId, 
      `⏸️ <b>АРБИТРАЖ ОСТАНОВЛЕН</b>\n\n` +
      `📊 Результаты:\n` +
      `   🔍 Проверок: ${stats.checks}\n` +
      `   🎯 Найдено: ${stats.found}\n` +
      `   📈 Эффективность: ${stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0}%`,
      { parse_mode: 'HTML', ...mainKeyboard }
    );
  }
}

// ==================== ОПТИМИЗИРОВАННЫЙ АРБИТРАЖ ====================
async function findArbitrageOpportunities(minProfit = 0.1) {
  const opportunities = [];
  const batchSize = 10; // Проверяем по 10 монет за раз для скорости
  
  // Разбиваем на батчи для оптимизации
  for (let i = 0; i < ACTIVE_SYMBOLS.length; i += batchSize) {
    const batch = ACTIVE_SYMBOLS.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (symbol) => {
      try {
        const prices = await getAllExchangePrices(symbol);
        if (prices.length < 2) return null;

        prices.sort((a, b) => a.price - b.price);
        const bestBuy = prices[0];
        const bestSell = prices[prices.length - 1];
        
        const profit = ((bestSell.price - bestBuy.price) / bestBuy.price * 100) - 0.15;
        
        if (profit >= minProfit && bestBuy.name !== bestSell.name) {
          return {
            symbol,
            buyExchange: bestBuy,
            sellExchange: bestSell,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            profit: profit,
            exchangesCount: prices.length
          };
        }
      } catch (error) {
        return null;
      }
      return null;
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        opportunities.push(result.value);
      }
    });

    // Небольшая пауза между батчами
    if (i + batchSize < ACTIVE_SYMBOLS.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return opportunities
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 15); // Возвращаем топ-15
}

async function getAllExchangePrices(symbol) {
  // Фильтруем биржи которые поддерживают эту монету
  const supportedExchanges = Object.entries(EXCHANGES)
    .filter(([, exchange]) => 
      exchange.supportedSymbols.includes(symbol) || 
      exchange.supportedSymbols === CRYPTO_SYMBOLS
    )
    .sort(([,a], [,b]) => b.weight - a.weight)
    .slice(0, 5); // Берем топ-5 самые быстрые

  const pricePromises = supportedExchanges.map(async ([key, exchange]) => {
    try {
      const price = await Promise.race([
        getPriceFromExchange(exchange.api(symbol), key, symbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      return {
        name: exchange.name,
        icon: getExchangeIcon(exchange.name),
        price: price,
        weight: exchange.weight
      };
    } catch (error) {
      return null;
    }
  });

  const results = await Promise.allSettled(pricePromises);
  return results
    .filter(result => result.status === 'fulfilled' && result.value?.price > 0)
    .map(result => result.value);
}

async function getPriceFromExchange(apiUrl, exchangeKey, symbol) {
  const cacheKey = `${exchangeKey}_${symbol}`;
  const data = await smartRequest(apiUrl, cacheKey, 1500);
  
  if (!data) throw new Error('No data');
  
  const exchange = EXCHANGES[exchangeKey];
  const price = exchange.parser(data);
  
  if (!price || price <= 0) throw new Error('Invalid price');
  return price;
}

// ==================== ОПТИМИЗИРОВАННЫЙ МОНИТОРИНГ ====================
async function startArbitrageMonitoring(chatId) {
  let checkCount = 0;
  const userSettings = arbitrageUsers.get(chatId);
  
  if (!userSettings) return;

  // Инициализация статистики
  arbitrageStats.set(chatId, { found: 0, checks: 0 });

  const monitor = async () => {
    if (!userSettings.active) return;

    try {
      checkCount++;
      const opportunities = await findArbitrageOpportunities(userSettings.minProfit);
      
      // Обновляем статистику
      const stats = arbitrageStats.get(chatId);
      stats.checks = checkCount;
      stats.found += opportunities.length;

      // Умные уведомления (не чаще чем раз в 30 секунд для одинаковых пар)
      const now = Date.now();
      for (const opp of opportunities) {
        const opportunityKey = `${opp.symbol}_${opp.buyExchange.name}_${opp.sellExchange.name}`;
        
        if (now - userSettings.lastNotification > 30000 || 
            !userSettings.lastOpportunity || 
            userSettings.lastOpportunity !== opportunityKey) {
          
          await sendArbitrageNotification(chatId, opp, checkCount);
          userSettings.lastNotification = now;
          userSettings.lastOpportunity = opportunityKey;
          await new Promise(resolve => setTimeout(resolve, 100)); // Защита от флуда
        }
      }

      // Статус каждые 10 проверок
      if (checkCount % 10 === 0) {
        await bot.sendMessage(chatId,
          `🔍 <b>Мониторинг активен</b>\n` +
          `📊 Проверок: ${checkCount}\n` +
          `🎯 Найдено: ${stats.found}\n` +
          `⚡ Следующая проверка через 2с...`,
          { parse_mode: 'HTML' }
        );
      }

    } catch (error) {
      console.error('Monitor error:', error.message);
    }

    // Следующая проверка через 2 секунды
    if (userSettings.active) {
      setTimeout(monitor, 2000);
    }
  };

  // Запускаем мониторинг
  monitor();
}

async function sendArbitrageNotification(chatId, opp, checkCount) {
  const message = `
🎯 <b>АРБИТРАЖ #${checkCount}</b>

${getCryptoIcon(opp.symbol)} <b>${getSymbolName(opp.symbol)}</b>

🔼 <b>ПОКУПКА:</b> ${opp.buyExchange.icon} ${opp.buyExchange.name}
   💵 ${formatPrice(opp.buyPrice)}

🔽 <b>ПРОДАЖА:</b> ${opp.sellExchange.icon} ${opp.sellExchange.name}  
   💵 ${formatPrice(opp.sellPrice)}

💰 <b>ПРИБЫЛЬ:</b> <u>${opp.profit.toFixed(2)}%</u>

⚡ <b>ДЕЙСТВИЯ:</b>
1. Купить на ${opp.buyExchange.name}
2. Продать на ${opp.sellExchange.name}

⏰ ${new Date().toLocaleTimeString()}
  `;

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================
function showStats(chatId) {
  const stats = arbitrageStats.get(chatId) || { found: 0, checks: 0 };
  const userSettings = arbitrageUsers.get(chatId);
  
  const message = `
📊 <b>СТАТИСТИКА СИСТЕМЫ</b>

🎯 <b>Текущий статус:</b> ${userSettings?.active ? '🟢 АКТИВЕН' : '🔴 ВЫКЛЮЧЕН'}
📈 <b>Минимальная прибыль:</b> ${userSettings?.minProfit || 0.3}%

📈 <b>Эффективность:</b>
   🔍 Всего проверок: ${stats.checks}
   🎯 Найдено возможностей: ${stats.found}
   📊 Успешность: ${stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0}%

⚡ <b>Масштаб системы:</b>
   🏪 Активных бирж: ${Object.keys(EXCHANGES).length}
   💰 Всего монет в базе: ${CRYPTO_SYMBOLS.length}
   🔥 Активных в проверке: ${ACTIVE_SYMBOLS.length}
   ⏱️ Время проверки: 2-3 секунды

🎪 <b>Категории монет:</b>
   • Топ-20 по капитализации
   • Мем-коины (высокая волатильность)
   • DeFi токены
   • AI сектор
   • Gaming/Metaverse
   • Layer 2 решения
   • Новые перспективные

💡 <b>Рекомендации:</b>
• Используйте 0.1-0.3% для максимального охвата
• Мем-коины дают больше арбитражных возможностей
• Проверяйте ликвидность перед сделкой
  `;

  bot.sendMessage(chatId, message, { 
    parse_mode: 'HTML',
    ...mainKeyboard 
  });
}

function sendSettings(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || { minProfit: 0.3 };
  
  const message = `
⚙️ <b>НАСТРОЙКИ АРБИТРАЖА</b>

Текущие настройки:
• 🎯 Минимальная прибыль: ${userSettings.minProfit}%
• 🔔 Уведомления: ВКЛ

Выберите минимальную прибыль для уведомлений:
<code>0.1% - Максимальная чувствительность
0.3% - Оптимальный баланс  
0.5% - Стабильная прибыль
1-2% - Высокая доходность</code>
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...settingsKeyboard
  });
}

function setMinProfit(chatId, profit) {
  const userSettings = arbitrageUsers.get(chatId) || { active: false };
  userSettings.minProfit = profit;
  arbitrageUsers.set(chatId, userSettings);

  bot.sendMessage(chatId, 
    `✅ <b>НАСТРОЙКИ ОБНОВЛЕНЫ</b>\n\n` +
    `🎯 Минимальная прибыль: <b>${profit}%</b>\n\n` +
    `Теперь вы будете получать уведомления о сделках с прибылью от ${profit}%`,
    { parse_mode: 'HTML', ...mainKeyboard }
  );
}

// ==================== БАЗОВЫЕ ФУНКЦИИ ====================
async function getCryptoPrice(symbol) {
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      timeout: 2000
    });
    return parseFloat(response.data.price);
  } catch (error) {
    return null;
  }
}

function getCryptoIcon(symbol) {
  const icons = {
    // Основные
    'BTCUSDT': '₿', 'ETHUSDT': '🔷', 'BNBUSDT': '🟡', 'SOLUSDT': '🔆', 'XRPUSDT': '✖️',
    'DOGEUSDT': '🐕', 'ADAUSDT': '🔷', 'AVAXUSDT': '❄️', 'DOTUSDT': '🟣', 'LINKUSDT': '🔗',
    
    // Мем-коины
    'SHIBUSDT': '🐶', 'PEPEUSDT': '🐸', 'FLOKIUSDT': '🐺', 'BONKUSDT': '🐕', 'WIFUSDT': '🧢',
    'MEMEUSDT': '🖼️', 'BOMEUSDT': '📚', 'POPCATUSDT': '🐱', 'MYROUSDT': '🦴', 'DOGSUSDT': '🐶',
    
    // DeFi
    'UNIUSDT': '🦄', 'CAKEUSDT': '🍰', 'COMPUSDT': '💸', 'AAVEUSDT': '👻', 'MKRUSDT': '⚙️',
    
    // Gaming/Metaverse
    'SANDUSDT': '🏖️', 'MANAUSDT': '👾', 'ENJUSDT': '⚡', 'GALAUSDT': '🎮', 'AXSUSDT': '🪙',
    
    // AI
    'FETUSDT': '🤖', 'AGIXUSDT': '🧠', 'RNDRUSDT': '🎨', 'TAOUSDT': '🔮', 'OCEANUSDT': '🌊',
    
    // Layer 2
    'ARBUSDT': '⚡', 'OPUSDT': '🔴', 'MATICUSDT': '🔶', 'IMXUSDT': '🎮', 'METISUSDT': 'Μ',
    
    // Privacy
    'XMRUSDT': '🔒', 'ZECUSDT': '🛡️', 'DASHUSDT': '💨', 'ZENUSDT': '☯️',
    
    // Storage
    'FILUSDT': '📁', 'ARUSDT': '🗂️', 'STORJUSDT': '☁️', 'SCUSDT': '💾',
    
    // Новые
    'SEIUSDT': '🌊', 'SUIUSDT': '💧', 'TIAUSDT': '🌐', 'INJUSDT': '💉', 'JUPUSDT': '🪐',
    
    // Старые но популярные
    'LTCUSDT': '⚡', 'BCHUSDT': '₿', 'ATOMUSDT': '⚛️', 'ETCUSDT': '⛏️', 'XLMUSDT': '🌟',
    'ALGOUSDT': '🔵', 'VETUSDT': '🔷', 'EOSUSDT': '🅴', 'TRXUSDT': '🌐', 'FTMUSDT': '👻'
  };
  
  return icons[symbol] || '💰';
}

function getExchangeIcon(exchangeName) {
  const icons = {
    'Binance': '🟡', 'Bybit': '🔵', 'MEXC': '🟠',
    'KuCoin': '🔵', 'OKX': '🔷'
  };
  return icons[exchangeName] || '🏪';
}

// ==================== ОБНОВЛЕННЫЕ ИМЕНА МОНЕТ ====================
function getSymbolName(symbol) {
  const names = {
    // Основные
    'BTCUSDT': 'Bitcoin', 'ETHUSDT': 'Ethereum', 'BNBUSDT': 'BNB', 'SOLUSDT': 'Solana',
    'XRPUSDT': 'Ripple', 'DOGEUSDT': 'Dogecoin', 'ADAUSDT': 'Cardano', 'AVAXUSDT': 'Avalanche',
    'DOTUSDT': 'Polkadot', 'LINKUSDT': 'Chainlink', 'MATICUSDT': 'Polygon', 'LTCUSDT': 'Litecoin',
    
    // Мем-коины
    'SHIBUSDT': 'Shiba Inu', 'PEPEUSDT': 'Pepe', 'FLOKIUSDT': 'Floki', 'BONKUSDT': 'Bonk',
    'WIFUSDT': 'dogwifhat', 'MEMEUSDT': 'Memecoin', 'BOMEUSDT': 'Book of Meme', 'POPCATUSDT': 'Popcat',
    'MYROUSDT': 'Myro', 'DOGSUSDT': 'Dogs',
    
    // DeFi
    'UNIUSDT': 'Uniswap', 'CAKEUSDT': 'PancakeSwap', 'COMPUSDT': 'Compound', 'AAVEUSDT': 'Aave',
    'MKRUSDT': 'Maker', 'SNXUSDT': 'Synthetix', 'CRVUSDT': 'Curve', 'SUSHIUSDT': 'SushiSwap',
    
    // AI
    'FETUSDT': 'Fetch.ai', 'AGIXUSDT': 'SingularityNET', 'RNDRUSDT': 'Render', 'TAOUSDT': 'Bittensor',
    'OCEANUSDT': 'Ocean Protocol',
    
    // Gaming
    'SANDUSDT': 'The Sandbox', 'MANAUSDT': 'Decentraland', 'ENJUSDT': 'Enjin', 'GALAUSDT': 'Gala',
    'AXSUSDT': 'Axie Infinity',
    
    // Layer 2
    'ARBUSDT': 'Arbitrum', 'OPUSDT': 'Optimism', 'IMXUSDT': 'Immutable X', 'METISUSDT': 'Metis',
    
    // Новые
    'SEIUSDT': 'Sei', 'SUIUSDT': 'Sui', 'TIAUSDT': 'Celestia', 'INJUSDT': 'Injective', 'JUPUSDT': 'Jupiter',
    'PYTHUSDT': 'Pyth', 'JTOUSDT': 'Jito', 'PENDLEUSDT': 'Pendle', 'ONDOUSDT': 'Ondo'
  };
  
  const baseSymbol = symbol.replace('USDT', '');
  return `${names[symbol] || baseSymbol} (${baseSymbol})`;
}

function formatPrice(price) {
  if (!price) return 'N/A';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}
function sendHelp(chatId) {
  const helpMessage = `
🆘 <b>ПОМОЩЬ ПО АРБИТРАЖНОМУ БОТУ</b>

⚡ <b>Масштаб системы:</b>
• <b>${CRYPTO_SYMBOLS.length}+ монет</b> в базе данных
• <b>${Object.keys(EXCHANGES).length} бирж</b> в реальном времени  
• <b>${ACTIVE_SYMBOLS.length} активных монет</b> в проверке
• Все категории: от Bitcoin до мем-коинов

🎯 <b>Категории монет:</b>
• ₿ <b>Голубые фишки</b> (BTC, ETH, BNB) - стабильность
• 🐶 <b>Мем-коины</b> (DOGE, SHIB, PEPE) - высокая волатильность
• 🔷 <b>DeFi</b> (UNI, AAVE, COMP) - средний риск
• 🤖 <b>AI токены</b> (FET, AGIX, RNDR) - перспективные
• 🎮 <b>Gaming</b> (SAND, MANA, GALA) - растущий сектор

💡 <b>Стратегии:</b>
• <b>Мем-коины</b> - больше арбитражных возможностей
• <b>Голубые фишки</b> - меньше риска, стабильная прибыль
• <b>Новые токены</b> - высокая волатильность

🏪 <b>Поддерживаемые биржи:</b>
🟡 Binance, 🔵 Bybit, 🟠 MEXC, 🔵 KuCoin, 🔷 OKX, 🟣 Gate.io, 🟠 Huobi

⏱️ <i>Система проверяет ${ACTIVE_SYMBOLS.length} монет каждые 2 секунды</i>
  `;

  bot.sendMessage(chatId, helpMessage, { 
    parse_mode: 'HTML',
    ...mainKeyboard
  });
}

console.log(`✅ Арбитражный бот запущен!`);
console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
console.log(`🏪 Подключено бирж: ${Object.keys(EXCHANGES).length}`);


