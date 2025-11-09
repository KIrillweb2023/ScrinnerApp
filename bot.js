import { configDotenv } from 'dotenv';
configDotenv();
import TelegramBot from "node-telegram-bot-api";
import axios from 'axios';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 200,
    autoStart: true,
    params: {
      timeout: 30
    }
  },
  request: {
    timeout: 10000,
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

console.log('🚀 Арбитражный бот запущен...');


//  МОНЕТЫ 
const CRYPTO_SYMBOLS = [
  // ТОП-30 ПО КАПИТАЛИЗАЦИИ (самые ликвидные)
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'ETCUSDT', 'XLMUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'NEARUSDT', 'VETUSDT', 'ALGOUSDT', 'ICPUSDT',
  'EOSUSDT', 'AAVEUSDT', 'GRTUSDT', 'QNTUSDT', 'XTZUSDT',

  // МЕМ-КОИНЫ (только самые популярные)
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT',
  'MEMEUSDT', 'BOMEUSDT', 'POPCATUSDT', 'MYROUSDT', 'DOGSUSDT',

  // AI ТОКЕНЫ (перспективные)
  'FETUSDT', 'AGIXUSDT', 'RNDRUSDT', 'TAOUSDT', 'OCEANUSDT',

  // GAMING/METAVERSE (топ-5)
  'GALAUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'PIXELUSDT',

  // НОВЫЕ ТОКЕНЫ (самые трендовые)
  'JUPUSDT', 'PYTHUSDT', 'JTOUSDT', 'PENDLEUSDT', 'ONDOUSDT',
  'TIAUSDT', 'SEIUSDT', 'SUIUSDT', 'INJUSDT'
];

const ACTIVE_SYMBOLS = [
  // Только самые ликвидные и волатильные
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT',
  'MATICUSDT', 'ATOMUSDT', 'SHIBUSDT', 'PEPEUSDT',
  'ARBUSDT', 'OPUSDT', 'FETUSDT', 'JUPUSDT',
  'PYTHUSDT', 'GALAUSDT', 'BONKUSDT'
];


const EXCHANGES = {
  BINANCE: {
    name: 'Binance',
    weight: 10,
    supportedSymbols: CRYPTO_SYMBOLS,
    api: (symbol) => `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price),
    timeout: 1200
  },
  BYBIT: {
    name: 'Bybit',
    weight: 9,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym =>
      !['POPCATUSDT', 'MYROUSDT', 'DOGSUSDT', 'TURBOUSDT'].includes(sym)
    ),
    api: (symbol) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
    parser: (data) => parseFloat(data.result?.list?.[0]?.lastPrice || 0),
    timeout: 1200
  },
  OKX: {
    name: 'OKX',
    weight: 9,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym =>
      !['MYROUSDT', 'DOGSUSDT', 'BONKUSDT', 'TURBOUSDT'].includes(sym)
    ),
    api: (symbol) => `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`,
    parser: (data) => parseFloat(data.data?.[0]?.last || 0),
    timeout: 1300
  },
  KUCOIN: {
    name: 'KuCoin',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym =>
      !sym.includes('BOME') && !sym.includes('POPCAT') && !sym.includes('TURBO')
    ),
    api: (symbol) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`,
    parser: (data) => parseFloat(data.data?.price || 0),
    timeout: 1400
  },
  MEXC: {
    name: 'MEXC',
    weight: 7,
    supportedSymbols: CRYPTO_SYMBOLS,
    api: (symbol) => `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price),
    timeout: 1400
  }
};

const arbitrageUsers = new Map();
const arbitrageStats = new Map();
const requestCache = new Map();

class EnhancedCache {
  constructor(duration = 1500) {
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

  cleanup() {
    const now = Date.now();
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > this.duration * 2) {
        requestCache.delete(key);
      }
    }
  }
}

const cache = new EnhancedCache(1500);

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['💰 Все монеты', '🎯 Арбитраж ON/OFF'],
      ['📊 Статистика', '🔍 Поиск монеты'],
      ['⚙️ Настройки', 'ℹ️ Помощь',]
    ],
    resize_keyboard: true
  }
};

const settingsKeyboard = {
  reply_markup: {
    keyboard: [
      ['🎯 Прибыль: 0.1%', '🎯 Прибыль: 0.3%', '🎯 Прибыль: 0.5%'],
      ['🎯 Прибыль: 1%', '🎯 Прибыль: 2%', '🎯 Прибыль: 5%'],
      ['↩️ Назад']
    ],
    resize_keyboard: true
  }
};


async function enhancedRequest(url, cacheKey, timeout = 1000) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await axios.get(url, {
      timeout,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    clearTimeout(timeoutId);
    const data = response.data;
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('Timeout');
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const welcomeMessage = `
🚀 <b>АРБИТРАЖНЫЙ БОТ</b>

⚡ <b>Основные возможности:</b>
• 🔥 ${CRYPTO_SYMBOLS.length}+ монет в базе
• 🏪 ${Object.keys(EXCHANGES).length} бирж в реальном времени
• ⏱️ Проверка за 1-2 секунды
• 🎯 Умный алгоритм арбитража

<b>Функции:</b>
• 💰 <b>Все монеты</b> - мгновенные цены
• 🎯 <b>Арбитраж ON/OFF</b> - авто-поиск
• 📊 <b>Статистика</b> - эффективность работы
• 🔍 <b>Поиск монеты</b> - быстрая проверка

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
    '💰 Все монеты': () => sendEnhancedPrices(chatId),
    '🎯 Арбитраж ON/OFF': () => toggleEnhancedArbitrage(chatId),
    '📊 Статистика': () => showEnhancedStats(chatId),
    '⚙️ Настройки': () => sendEnhancedSettings(chatId),
    '🔍 Поиск монеты': () => askForSymbol(chatId),
    '🎯 Прибыль: 0.1%': () => setMinProfit(chatId, 0.1),
    '🎯 Прибыль: 0.3%': () => setMinProfit(chatId, 0.3),
    '🎯 Прибыль: 0.5%': () => setMinProfit(chatId, 0.5),
    '🎯 Прибыль: 1%': () => setMinProfit(chatId, 1),
    '🎯 Прибыль: 2%': () => setMinProfit(chatId, 2),
    '🎯 Прибыль: 5%': () => setMinProfit(chatId, 5),
    '↩️ Назад': () => bot.sendMessage(chatId, "🏠 <b>Главное меню</b>", {
      parse_mode: 'HTML',
      ...mainKeyboard
    }),
    'ℹ️ Помощь': () => sendEnhancedHelp(chatId)
  };

  if (commandMap[text]) {
    await commandMap[text]();
  } else if (text && text.length <= 10 && !text.startsWith('/')) {
    await searchSymbol(chatId, text.toUpperCase() + 'USDT');
  }
});

async function searchSymbol(chatId, symbol) {
  if (!symbol.endsWith('USDT')) {
    symbol = symbol + 'USDT';
  }

  const loadingMsg = await bot.sendMessage(chatId,
    `🔍 <b>Поиск монеты: ${symbol.replace('USDT', '')}</b>`,
    { parse_mode: 'HTML' }
  );

  try {
    const prices = await getAllEnhancedExchangePrices(symbol);

    if (prices.length === 0) {
      await bot.editMessageText(
        `❌ <b>Монета не найдена</b>\n\n` +
        `Символ: ${symbol}\n` +
        `💡 Проверьте правильность написания`,
        {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: 'HTML'
        }
      );
      return;
    }

    prices.sort((a, b) => a.price - b.price);

    let message = `🔍 <b>РЕЗУЛЬТАТЫ ПОИСКА: ${getSymbolName(symbol)}</b>\n\n`;

    prices.forEach((exchange, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
      message += `${medal} ${exchange.icon} <b>${exchange.name}</b>\n`;
      message += `   💵 ${formatPrice(exchange.price)}\n`;
      if (index === 0) message += `   🏆 <i>Лучшая цена для покупки</i>\n`;
      if (index === prices.length - 1) message += `   💰 <i>Лучшая цена для продажи</i>\n`;
      message += '\n';
    });

    const bestBuy = prices[0];
    const bestSell = prices[prices.length - 1];
    const profit = ((bestSell.price - bestBuy.price) / bestBuy.price * 100) - 0.15;

    message += `⚡ <b>АРБИТРАЖНЫЙ АНАЛИЗ:</b>\n`;
    message += `   📉 Купить на: ${bestBuy.icon} ${bestBuy.name}\n`;
    message += `   📈 Продать на: ${bestSell.icon} ${bestSell.name}\n`;
    message += `   💰 Прибыль: <b>${profit.toFixed(2)}%</b>\n`;

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });

  } catch (error) {
    await bot.editMessageText(
      "❌ <b>Ошибка при поиске монеты</b>",
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'HTML'
      }
    );
  }
}

async function sendEnhancedPrices(chatId) {
  const loadingMsg = await bot.sendMessage(chatId,
    "⚡ <b>Мгновенная загрузка цен...</b>\n",
    { parse_mode: 'HTML' }
  );

  const startTime = Date.now(); // Сохраняем время начала

  try {
    const topSymbols = ACTIVE_SYMBOLS.slice(0, 30);
    const prices = await Promise.allSettled(
      topSymbols.map(symbol => getCryptoPrice(symbol))
    );

    let message = "💰 <b>Мгновенные цены (Binance)</b>\n\n";
    let count = 0;

    prices.forEach((result, index) => {
      const symbol = topSymbols[index];
      if (result.status === 'fulfilled' && result.value) {
        const price = result.value;
        count++;
        message += `${getCryptoIcon(symbol)} <b>${getSymbolName(symbol)}</b>\n`;
        message += `   💵 ${formatPrice(price)}\n`;

        if (count % 3 === 0) message += '\n';
      }
    });

    const loadTime = Date.now() - startTime; // Правильный расчет времени
    message += `\n⏱️ <i>Загружено ${count} монет за ${loadTime}мс</i>`;
    message += `\n📊 <i>Всего в базе: ${CRYPTO_SYMBOLS.length} монет</i>`;

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    await bot.editMessageText("❌ Ошибка загрузки цен", {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  }
}



async function findEnhancedArbitrageOpportunities(minProfit = 0.1) {
  const opportunities = [];
  const batchSize = 15; // Увеличили батч, так как бирж меньше

  for (let i = 0; i < ACTIVE_SYMBOLS.length; i += batchSize) {
    const batch = ACTIVE_SYMBOLS.slice(i, i + batchSize);

    const batchPromises = batch.map(async (symbol) => {
      try {
        const prices = await getAllEnhancedExchangePrices(symbol);
        if (prices.length < 2) return null;

        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        if (minPrice.key === maxPrice.key) return null;

        const priceDifference = maxPrice.price - minPrice.price;
        const netProfit = calculateRealArbitrageProfit(minPrice.price, maxPrice.price, symbol);

        if (netProfit >= minProfit && priceDifference > minPrice.price * 0.00003) {
          const reliability = calculateReliabilityScore(minPrice, maxPrice);

          return {
            symbol,
            buyExchange: minPrice,
            sellExchange: maxPrice,
            buyPrice: minPrice.price,
            sellPrice: maxPrice.price,
            profit: Number(netProfit.toFixed(3)),
            priceDifference: Number(priceDifference.toFixed(8)),
            reliability: reliability,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        return null;
      }
      return null;
    });

    const batchResults = await Promise.all(batchPromises);
    opportunities.push(...batchResults.filter(opp => opp !== null));
  }

  return opportunities
    .filter(opp => opp.profit >= minProfit)
    .sort((a, b) => {
      if (b.profit !== a.profit) return b.profit - a.profit;
      return b.reliability - a.reliability;
    })
    .slice(0, 10); // Увеличили лимит до 10
}

function calculateReliabilityScore(buyExchange, sellExchange) {
  let score = 0.8; // Повысили базовый скоринг, так как все биржи надежные

  // Все оставшиеся биржи достаточно надежны
  if (buyExchange.weight >= 9 && sellExchange.weight >= 9) {
    score += 0.15;
  } else if (buyExchange.weight >= 8 && sellExchange.weight >= 8) {
    score += 0.1;
  }

  // Проверенные пары среди надежных бирж
  const reliablePairs = [
    ['BINANCE', 'BYBIT'], ['BINANCE', 'OKX'], ['BYBIT', 'OKX'],
    ['BINANCE', 'KUCOIN'], ['BYBIT', 'KUCOIN'], ['BINANCE', 'MEXC'],
    ['OKX', 'KUCOIN'], ['BYBIT', 'MEXC']
  ];

  const isReliablePair = reliablePairs.some(pair =>
    (pair[0] === buyExchange.key && pair[1] === sellExchange.key) ||
    (pair[1] === buyExchange.key && pair[0] === sellExchange.key)
  );

  if (isReliablePair) {
    score += 0.1;
  }

  return Math.min(1, Math.max(0.6, score)); // Минимальная надежность 0.6
}

async function getAllEnhancedExchangePrices(symbol) {
  const supportedExchanges = Object.entries(EXCHANGES)
    .filter(([, exchange]) =>
      exchange.supportedSymbols.includes(symbol) ||
      exchange.supportedSymbols === CRYPTO_SYMBOLS
    )
    .sort(([, a], [, b]) => b.weight - a.weight);

  const pricePromises = supportedExchanges.map(async ([key, exchange]) => {
    try {
      const price = await getPriceFromExchange(exchange.api(symbol), key, symbol, exchange.timeout || 1200);

      if (!isValidPrice(price, symbol)) {
        return null;
      }

      return {
        name: exchange.name,
        icon: getExchangeIcon(exchange.name),
        price: Number(price.toFixed(8)),
        weight: exchange.weight,
        key: key,
        timestamp: Date.now()
      };
    } catch (error) {
      return null;
    }
  });

  const results = await Promise.allSettled(pricePromises);

  const validPrices = results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value)
    .filter(exchange => exchange !== null && exchange.price > 0);

  return validPrices.sort((a, b) => a.price - b.price);
}

async function startArbitrageMonitoring(chatId) {
  let checkCount = 0;
  const userSettings = arbitrageUsers.get(chatId);

  if (!userSettings) return;

  arbitrageStats.set(chatId, { found: 0, checks: 0, lastFound: 0 });

  const monitor = async () => {
    if (!userSettings.active) return;

    try {
      checkCount++;
      const opportunities = await findEnhancedArbitrageOpportunities(userSettings.minProfit);

      const stats = arbitrageStats.get(chatId);
      stats.checks = checkCount;
      stats.found += opportunities.length;

      if (opportunities.length > 0) {
        stats.lastFound = Date.now();

        // Отправляем все найденные возможности
        for (const opp of opportunities) {
          const opportunityKey = `${opp.symbol}_${Math.round(opp.profit * 100)}_${checkCount}`;

          if (!userSettings.lastOpportunity || userSettings.lastOpportunity !== opportunityKey) {
            await sendArbitrageNotification(chatId, opp, checkCount);
            userSettings.lastOpportunity = opportunityKey;
            await new Promise(resolve => setTimeout(resolve, 200)); // Короткая пауза
          }
        }
        userSettings.lastNotification = Date.now();
      }

      // Статус каждые 10 проверок
      if (checkCount % 10 === 0) {
        const successRate = stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0;
        await bot.sendMessage(chatId,
          `🔍 <b>Мониторинг активен</b>\n` +
          `📊 Проверок: ${stats.checks}\n` +
          `🎯 Найдено: ${stats.found}\n` +
          `📈 Успешность: ${successRate}%\n` +
          `⚡ Следующая проверка через 1.5с...`,
          { parse_mode: 'HTML' }
        );
      }

    } catch (error) {
      console.error('Monitor error:', error.message);
    }

    if (userSettings.active) {
      setTimeout(monitor, 1500); // Уменьшили интервал до 1.5 секунд
    }
  };

  monitor();
}

function isValidPrice(price, symbol) {
  if (!price || price <= 0 || isNaN(price)) return false;

  // Увеличили максимальные диапазоны для мем-коинов
  const priceRanges = {
    'BTCUSDT': { min: 1000, max: 500000 },
    'ETHUSDT': { min: 50, max: 50000 },
    'BNBUSDT': { min: 5, max: 2000 },
    'SOLUSDT': { min: 0.5, max: 5000 },
    'SHIBUSDT': { min: 0.00000001, max: 0.1 },
    'PEPEUSDT': { min: 0.00000001, max: 0.01 },
    'BONKUSDT': { min: 0.00000001, max: 0.1 },
    'default': { min: 0.000001, max: 1000 }
  };

  const range = priceRanges[symbol] || priceRanges.default;

  return price >= range.min && price <= range.max;
}


async function sendArbitrageNotification(chatId, opp, checkCount) {
  const profitColor = opp.profit >= 1 ? '🟢' : opp.profit >= 0.5 ? '🟡' : '🔴';
  const reliabilityIcon = opp.reliability >= 0.8 ? '✅' : opp.reliability >= 0.6 ? '⚠️' : '🔸';

  const message = `
🎯 <b>АРБИТРАЖ #${checkCount}</b> ${reliabilityIcon}

${getCryptoIcon(opp.symbol)} <b>${getSymbolName(opp.symbol)}</b>
${profitColor} <b>ПРИБЫЛЬ: ${opp.profit.toFixed(3)}%</b>

🔼 <b>КУПИТЬ:</b> ${opp.buyExchange.icon} ${opp.buyExchange.name}
   💵 ${formatPrice(opp.buyPrice)}

🔽 <b>ПРОДАТЬ:</b> ${opp.sellExchange.icon} ${opp.sellExchange.name}  
   💵 ${formatPrice(opp.sellPrice)}

📊 <b>ДЕТАЛИ:</b>
   📐 Разница: ${formatPrice(opp.priceDifference)}
   📈 Надежность: ${(opp.reliability * 100).toFixed(0)}%

⚡ <i>Возможность найдена в ${new Date().toLocaleTimeString()}</i>
  `;

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
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
    'Binance': '🟡',
    'Bybit': '🔵',
    'OKX': '🔷',
    'KuCoin': '🔵',
    'MEXC': '🟠'
  };
  return icons[exchangeName] || '🏪';
}

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

async function getPriceFromExchange(apiUrl, exchangeKey, symbol, timeout = 1000) {
  const cacheKey = `${exchangeKey}_${symbol}`;
  const data = await enhancedRequest(apiUrl, cacheKey, timeout);

  if (!data) throw new Error('No data');

  const exchange = EXCHANGES[exchangeKey];
  const price = exchange.parser(data);

  if (!price || price <= 0) throw new Error('Invalid price');
  return price;
}

function toggleEnhancedArbitrage(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || {
    active: false,
    minProfit: 0.1, // По умолчанию 0.1% для большей чувствительности
    lastNotification: 0
  };

  userSettings.active = !userSettings.active;
  arbitrageUsers.set(chatId, userSettings);

  if (userSettings.active) {
    bot.sendMessage(chatId,
      `🎯 <b>АРБИТРАЖ АКТИВИРОВАН</b>\n\n` +
      `📈 Минимальная прибыль: <b>${userSettings.minProfit}%</b>\n` +
      `⚡ Проверка каждые 1.5 секунды\n` +
      `🔔 Расширенный поиск\n` +
      `🏪 ${Object.keys(EXCHANGES).length} бирж одновременно\n\n` +
      `<i>Система ищет возможности...</i>`,
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

function showEnhancedStats(chatId) {
  const stats = arbitrageStats.get(chatId) || { found: 0, checks: 0, lastFound: 0 };
  const userSettings = arbitrageUsers.get(chatId);

  const successRate = stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0;
  const lastFound = stats.lastFound ? new Date(stats.lastFound).toLocaleTimeString() : 'не найдено';

  const message = `
📊 <b>СТАТИСТИКА СИСТЕМЫ</b>

🎯 <b>Текущий статус:</b> ${userSettings?.active ? '🟢 АКТИВЕН' : '🔴 ВЫКЛЮЧЕН'}
📈 <b>Минимальная прибыль:</b> ${userSettings?.minProfit || 0.3}%

📈 <b>Эффективность:</b>
   🔍 Всего проверок: ${stats.checks}
   🎯 Найдено возможностей: ${stats.found}
   📊 Успешность: ${successRate}%
   ⏰ Последняя находка: ${lastFound}

⚡ <b>Масштаб системы:</b>
   🏪 Активных бирж: ${Object.keys(EXCHANGES).length}
   💰 Всего монет в базе: ${CRYPTO_SYMBOLS.length}
   🔥 Активных в проверке: ${ACTIVE_SYMBOLS.length}
   ⏱️ Интервал проверки: 3 секунды
  `;

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });
}

function sendEnhancedSettings(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || { minProfit: 0.3 };

  const message = `
⚙️ <b>НАСТРОЙКИ АРБИТРАЖА</b>

Текущие настройки:
• 🎯 Минимальная прибыль: ${userSettings.minProfit}%

Выберите минимальную прибыль для уведомлений:
<code>0.1% - Максимальная чувствительность
0.3% - Оптимальный баланс  
0.5% - Стабильная прибыль
1-2% - Высокая доходность
5%   - Премиум возможности</code>
  `;

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...settingsKeyboard
  });
}

function sendEnhancedHelp(chatId) {
  const helpMessage = `
🆘 <b>ПОМОЩЬ ПО АРБИТРАЖНОМУ БОТУ</b>

⚡ <b>Масштаб системы:</b>
• <b>${CRYPTO_SYMBOLS.length} монет</b> в базе данных
• <b>${Object.keys(EXCHANGES).length} бирж</b> в реальном времени  
• <b>${ACTIVE_SYMBOLS.length} активных монет</b> в проверке
• Все категории: от Bitcoin до AI токенов

🎯 <b>Категории монет:</b>
• ₿ <b>Голубые фишки</b> (BTC, ETH, BNB) - стабильность
• 🐶 <b>Мем-коины</b> - высокая волатильность
• 🤖 <b>AI токены</b> - перспективные проекты
• 🎮 <b>Gaming/Metaverse</b> - растущий сектор
• 🚀 <b>Новые токены</b> - трендовые монеты

💡 <b>Стратегии:</b>
• <b>Мем-коины</b> - больше арбитражных возможностей
• <b>AI токены</b> - перспективный рост
• <b>Новые токены</b> - высокая волатильность
• <b>Голубые фишки</b> - меньше риска

🏪 <b>Поддерживаемые биржи:</b>
🟡 Binance, 🔵 Bybit, 🟠 MEXC, 🔵 KuCoin, 🔷 OKX

⏱️ <i>Система проверяет ${ACTIVE_SYMBOLS.length} монет каждые 3 секунды</i>
  `;

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'HTML',
    ...mainKeyboard
  });
}

function askForSymbol(chatId) {
  bot.sendMessage(chatId,
    "🔍 <b>ПОИСК МОНЕТЫ</b>\n\n" +
    "Введите тикер монеты (например: BTC, ETH, SOL, PEPE):",
    {
      parse_mode: 'HTML',
      reply_markup: { force_reply: true }
    }
  );
}


console.log(`✅ Арбитражный бот запущен!`);
console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
console.log(`🏪 Подключено бирж: ${Object.keys(EXCHANGES).length}`);
console.log(`⏱️ Интервал проверки: 3 секунды`);