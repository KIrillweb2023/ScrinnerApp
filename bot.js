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

// ==================== РАСШИРЕННАЯ БАЗА ДАННЫХ МОНЕТ ====================

const CRYPTO_SYMBOLS = [
  // ========== ТОП-50 ПО КАПИТАЛИЗАЦИИ ==========
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'ETCUSDT', 'XLMUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'NEARUSDT', 'VETUSDT', 'ALGOUSDT', 'ICPUSDT',
  'EOSUSDT', 'AAVEUSDT', 'GRTUSDT', 'QNTUSDT', 'XTZUSDT',
  'SANDUSDT', 'MANAUSDT', 'EGLDUSDT', 'THETAUSDT', 'AXSUSDT',
  'FTMUSDT', 'RUNEUSDT', 'KAVAUSDT', 'MKRUSDT', 'SNXUSDT',
  'CRVUSDT', 'COMPUSDT', 'YFIUSDT', 'DASHUSDT', 'ZECUSDT',
  'ENJUSDT', 'BATUSDT', 'ZILUSDT', 'IOTAUSDT', 'NEOUSDT',

  // ========== МЕМ-КОИНЫ (ВЫСОКАЯ ВОЛАТИЛЬНОСТЬ) ==========
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT',
  'MEMEUSDT', 'BOMEUSDT', 'POPCATUSDT', 'MYROUSDT', 'DOGSUSDT',
  'TOSHIUSDT', 'WENUSDT', 'CATUSDT', 'MOGUSDT', 'NIZAUSDT',
  'TURBOUSDT', 'ANDYUSDT', 'LOLLYUSDT', 'MOUTAIUSDT', 'PENGUUSDT',
  'WOWUSDT', 'SMURFCATUSDT', 'MICKEYUSDT', 'SATOSHIUSDT', 'DOGE20USDT',

  // ========== DeFi ТОКЕНЫ ==========
  'UNIUSDT', 'CAKEUSDT', 'SUSHIUSDT', '1INCHUSDT', 'BALUSDT',
  'BANDUSDT', 'UMAUSDT', 'RENUSDT', 'RSRUSDT', 'COTIUSDT',
  'OCEANUSDT', 'NMRUSDT', 'REQUSDT', 'LRCUSDT', 'OMGUSDT',
  'CELRUSDT', 'ANKRUSDT', 'STORJUSDT', 'HOTUSDT', 'VTHOUSDT',

  // ========== AI ТОКЕНЫ ==========
  'FETUSDT', 'AGIXUSDT', 'RNDRUSDT', 'TAOUSDT', 'OCEANUSDT',
  'AKTUSDT', 'NFPUSDT', 'AIUSDT', 'PAALUSDT', 'CTXCUSDT',
  'VAIUSDT', 'DBCUSDT', 'NMRUSDT', 'PRIMEUSDT', 'XAIUSDT',
  'ARSUSDT', 'ORAIUSDT', 'PHBUSDT', 'ALIUSDT', 'MYRIAUSDT',

  // ========== GAMING/METAVERSE ==========
  'GALAUSDT', 'ENJUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT',
  'ILVUSDT', 'YGGUSDT', 'PIXELUSDT', 'BEAMUSDT', 'ACEUSDT',
  'MAGICUSDT', 'GHSTUSDT', 'CEREUSDT', 'SLPUSDT', 'ALICEUSDT',
  'DARUSDT', 'VRAUSDT', 'TLMUSDT', 'REVVUSDT', 'PYRUSDT',

  // ========== LAYER 2 ==========
  'ARBUSDT', 'OPUSDT', 'MATICUSDT', 'IMXUSDT', 'METISUSDT',
  'MNTUSDT', 'STRKUSDT', 'ZKUSDT', 'LRCUSDT', 'BOBAUSDT',
  'CELOUSDT', 'SKLUSDT', 'OMGUSDT', 'LOOMUSDT', 'PERPUSDT',

  // ========== REAL WORLD ASSETS (RWA) ==========
  'ONDOUSDT', 'TRUUSDT', 'CFGUSDT', 'RIOUSDT', 'PROUSDT',
  'IXSUSDT', 'LCXUSDT', 'HIFIUSDT', 'TRACUSDT', 'LABSUSDT',

  // ========== PRIVACY ==========
  'XMRUSDT', 'ZECUSDT', 'DASHUSDT', 'ZENUSDT', 'SCRTUSDT',
  'BEAMUSDT', 'MOBUSDT', 'FIROUSDT', 'XVGUSDT', 'NAVUSDT',

  // ========== ORACLES ==========
  'LINKUSDT', 'BANDUSDT', 'TRBUSDT', 'API3USDT', 'DIAUSDT',
  'NESTUSDT', 'POKTUSDT', 'UMABUSD', 'VXVUSDT', 'XYOUSDT',

  // ========== STORAGE ==========
  'FILUSDT', 'ARUSDT', 'STORJUSDT', 'SCUSDT', 'BTTUSDT',
  'HOTUSDT', 'STXUSDT', 'ANKRUSDT', 'PHAUSDT', 'OCEANUSDT',

  // ========== NEW & TRENDING ==========
  'SEIUSDT', 'SUIUSDT', 'TIAUSDT', 'INJUSDT', 'JUPUSDT',
  'PYTHUSDT', 'JTOUSDT', 'PORTALUSDT', 'PENDLEUSDT', 'DYMUSDT',
  'ALTUSDT', 'ZETAUSDT', 'MAVIAUSDT', 'AXLUSDT', 'DUSKUSDT',
  'METISUSDT', 'RONINUSDT', 'XAIUSDT', 'WUSDT', 'NTRNUSDT',

  // ========== MICRO-CAPS WITH POTENTIAL ==========
  'RAYUSDT', 'ORCAUSDT', 'SRMUSDT', 'MNGOUSDT', 'ATLASUSDT',
  'POLISUSDT', 'SAMOUSDT', 'KINUSDT', 'COPEUSDT', 'LIKEUSDT',
  'PRQUSDT', 'TRUUSDT', 'CVCUSDT', 'OXTUSDT', 'NUUSDT',

  // ========== STABLECOINS ==========
  'USDCUSDT', 'USDTUSDC', 'DAIUSDT', 'BUSDUSDT', 'TUSDUSDT',
  'FDUSDUSDT', 'USDPUSDT', 'GUSDUSDT', 'GUSDTUSDT', 'USTCUSDT',

  // ========== EXOTIC HIGH-VOLUME ==========
  'FTMUSDT', 'EGLDUSDT', 'THETAUSDT', 'KAVAUSDT', 'RVNUSDT',
  'IOTAUSDT', 'NEOUSDT', 'ONTUSDT', 'QTUMUSDT', 'WAVESUSDT',
  'LSKUSDT', 'ARDRUSDT', 'STEEMUSDT', 'DCRUSDT', 'ZRXUSDT'
];

// Активные монеты для арбитража (оптимизированные по ликвидности)
const ACTIVE_SYMBOLS = [
  // Топ-20 по объему
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'UNIUSDT', 'ARBUSDT',

  // Высоковолатильные мемы
  'BONKUSDT', 'WIFUSDT', 'MEMEUSDT', 'BOMEUSDT', 'POPCATUSDT',
  'MYROUSDT', 'DOGSUSDT', 'TURBOUSDT', 'ANDYUSDT', 'WENUSDT',

  // AI сектор
  'FETUSDT', 'AGIXUSDT', 'RNDRUSDT', 'TAOUSDT', 'OCEANUSDT',
  'AKTUSDT', 'NFPUSDT', 'AIUSDT', 'PAALUSDT', 'CTXCUSDT',

  // Gaming
  'GALAUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'PIXELUSDT',
  'BEAMUSDT', 'ACEUSDT', 'MAGICUSDT', 'YGGUSDT', 'ILVUSDT',

  // Новые токены
  'JUPUSDT', 'PYTHUSDT', 'JTOUSDT', 'PENDLEUSDT', 'ONDOUSDT',
  'DYMUSDT', 'ALTUSDT', 'ZETAUSDT', 'STRKUSDT', 'TIAUSDT',

  // DeFi
  'AAVEUSDT', 'MKRUSDT', 'COMPUSDT', 'CRVUSDT', 'SNXUSDT',
  'SUSHIUSDT', 'CAKEUSDT', '1INCHUSDT', 'BALUSDT', 'UNIUSDT'
];

// ==================== УЛУЧШЕННАЯ КОНФИГУРАЦИЯ БИРЖ ====================

const EXCHANGES = {
  BINANCE: {
    name: 'Binance',
    weight: 10,
    supportedSymbols: CRYPTO_SYMBOLS,
    api: (symbol) => `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price),
    volume: (symbol) => `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    volumeParser: (data) => parseFloat(data.volume)
  },
  BYBIT: {
    name: 'Bybit', 
    weight: 9,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !['POPCATUSDT', 'MYROUSDT', 'DOGSUSDT', 'TURBOUSDT'].includes(sym)
    ),
    api: (symbol) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
    parser: (data) => parseFloat(data.result?.list?.[0]?.lastPrice || 0),
    volume: (symbol) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
    volumeParser: (data) => parseFloat(data.result?.list?.[0]?.volume24h || 0)
  },
  MEXC: {
    name: 'MEXC',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS,
    api: (symbol) => `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`,
    parser: (data) => parseFloat(data.price),
    volume: (symbol) => `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`,
    volumeParser: (data) => parseFloat(data.volume)
  },
  KUCOIN: {
    name: 'KuCoin',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !sym.includes('BOME') && !sym.includes('POPCAT') && !sym.includes('TURBO')
    ),
    api: (symbol) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`,
    parser: (data) => parseFloat(data.data?.price || 0),
    volume: (symbol) => `https://api.kucoin.com/api/v1/market/stats?symbol=${symbol}`,
    volumeParser: (data) => parseFloat(data.data?.vol || 0)
  },
  OKX: {
    name: 'OKX',
    weight: 9,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !['MYROUSDT', 'DOGSUSDT', 'BONKUSDT', 'TURBOUSDT'].includes(sym)
    ),
    api: (symbol) => `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`,
    parser: (data) => parseFloat(data.data?.[0]?.last || 0),
    volume: (symbol) => `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`,
    volumeParser: (data) => parseFloat(data.data?.[0]?.vol24h || 0)
  },
  GATEIO: {
    name: 'Gate.io',
    weight: 8,
    supportedSymbols: CRYPTO_SYMBOLS,
    api: (symbol) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol.replace('USDT', '_USDT')}`,
    parser: (data) => parseFloat(data[0]?.last || 0),
    volume: (symbol) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol.replace('USDT', '_USDT')}`,
    volumeParser: (data) => parseFloat(data[0]?.base_volume || 0)
  },
  HUOBI: {
    name: 'Huobi',
    weight: 7,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !sym.includes('PEPE') && !sym.includes('BONK') && !sym.includes('MEME')
    ),
    api: (symbol) => `https://api.huobi.pro/market/detail/merged?symbol=${symbol.toLowerCase()}`,
    parser: (data) => parseFloat(data.tick?.close || 0),
    volume: (symbol) => `https://api.huobi.pro/market/detail?symbol=${symbol.toLowerCase()}`,
    volumeParser: (data) => parseFloat(data.tick?.vol || 0)
  },
  BITGET: {
    name: 'Bitget',
    weight: 7,
    supportedSymbols: CRYPTO_SYMBOLS.filter(sym => 
      !sym.includes('POPCAT') && !sym.includes('TURBO')
    ),
    api: (symbol) => `https://api.bitget.com/api/spot/v1/market/ticker?symbol=${symbol}`,
    parser: (data) => parseFloat(data.data?.close || 0),
    volume: (symbol) => `https://api.bitget.com/api/spot/v1/market/ticker?symbol=${symbol}`,
    volumeParser: (data) => parseFloat(data.data?.baseVol || 0)
  }
};

// ==================== УЛУЧШЕННЫЕ СИСТЕМЫ ====================
const arbitrageUsers = new Map();
const arbitrageStats = new Map();
const requestCache = new Map();
const volumeCache = new Map();

class EnhancedCache {
  constructor(duration = 2000) {
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

const cache = new EnhancedCache(2000);

// ==================== УЛУЧШЕННЫЕ КЛАВИАТУРЫ ====================
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['💰 Все монеты', '🎯 Арбитраж ON/OFF', '⚡ Быстрый арбитраж'],
      ['📊 Статистика', '🔥 Топ арбитраж', '🏪 Биржи'],
      ['⚙️ Настройки', 'ℹ️ Помощь', '🔍 Поиск монеты']
    ],
    resize_keyboard: true
  }
};

const settingsKeyboard = {
  reply_markup: {
    keyboard: [
      ['🎯 Прибыль: 0.1%', '🎯 Прибыль: 0.3%', '🎯 Прибыль: 0.5%'],
      ['🎯 Прибыль: 1%', '🎯 Прибыль: 2%', '🎯 Прибыль: 5%'],
      ['🔔 Уведомления: ВКЛ', '🔕 Уведомления: ВЫКЛ', '↩️ Назад']
    ],
    resize_keyboard: true
  }
};

const exchangeKeyboard = {
  reply_markup: {
    keyboard: [
      ['🏪 Все биржи', '🏪 Топ биржи', '🏪 Объемы'],
      ['↩️ Назад']
    ],
    resize_keyboard: true
  }
};

// ==================== ОПТИМИЗИРОВАННЫЕ УТИЛИТЫ ====================
async function enhancedRequest(url, cacheKey, timeout = 1500) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await Promise.race([
      axios.get(url, { 
        timeout,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
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
🚀 <b>УЛУЧШЕННЫЙ АРБИТРАЖНЫЙ БОТ</b>

⚡ <b>Расширенные возможности:</b>
• 🔥 ${CRYPTO_SYMBOLS.length}+ монет в базе
• 🏪 ${Object.keys(EXCHANGES).length} бирж в реальном времени
• ⏱️ Проверка за 1-2 секунды
• 🎯 Умный алгоритм арбитража
• 📊 Анализ объемов и ликвидности

<b>Новые функции:</b>
• 🔥 <b>Топ арбитраж</b> - лучшие возможности
• 🏪 <b>Биржи</b> - сравнение и аналитика
• 🔍 <b>Поиск монеты</b> - мгновенная проверка
• 📈 <b>Анализ объемов</b> - безопасные сделки

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
    '⚡ Быстрый арбитраж': () => quickEnhancedArbitrage(chatId),
    '📊 Статистика': () => showEnhancedStats(chatId),
    '🔥 Топ арбитраж': () => showTopArbitrage(chatId),
    '🏪 Биржи': () => showExchanges(chatId),
    '⚙️ Настройки': () => sendEnhancedSettings(chatId),
    '🔍 Поиск монеты': () => askForSymbol(chatId),
    '🏪 Все биржи': () => showAllExchanges(chatId),
    '🏪 Топ биржи': () => showTopExchanges(chatId),
    '🏪 Объемы': () => showVolumeAnalysis(chatId),
    '🎯 Прибыль: 0.1%': () => setMinProfit(chatId, 0.1),
    '🎯 Прибыль: 0.3%': () => setMinProfit(chatId, 0.3),
    '🎯 Прибыль: 0.5%': () => setMinProfit(chatId, 0.5),
    '🎯 Прибыль: 1%': () => setMinProfit(chatId, 1),
    '🎯 Прибыль: 2%': () => setMinProfit(chatId, 2),
    '🎯 Прибыль: 5%': () => setMinProfit(chatId, 5),
    '🔔 Уведомления: ВКЛ': () => setNotifications(chatId, true),
    '🔕 Уведомления: ВЫКЛ': () => setNotifications(chatId, false),
    '↩️ Назад': () => bot.sendMessage(chatId, "🏠 <b>Главное меню</b>", { 
      parse_mode: 'HTML',
      ...mainKeyboard 
    }),
    'ℹ️ Помощь': () => sendEnhancedHelp(chatId)
  };

  if (commandMap[text]) {
    await commandMap[text]();
  } else if (text && text.length <= 10 && !text.startsWith('/')) {
    // Если короткое сообщение, возможно это тикер монеты
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

// ==================== НОВЫЕ УЛУЧШЕННЫЕ ФУНКЦИИ ====================

async function sendEnhancedPrices(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "⚡ <b>Мгновенная загрузка цен...</b>\n<i>Обновленная база из 300+ монет</i>", 
    { parse_mode: 'HTML' }
  );

  try {
    // Берем топ 30 монет для показа
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
        
        // Группируем по 3 монеты в строку для компактности
        if (count % 3 === 0) message += '\n';
      }
    });

    message += `\n⏱️ <i>Загружено ${count} монет за ${Date.now() - loadingMsg.date * 1000}мс</i>`;
    message += `\n📊 <i>Всего в базе: ${CRYPTO_SYMBOLS.length} монет</i>`;

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

async function quickEnhancedArbitrage(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "⚡ <b>Улучшенная проверка арбитража...</b>\n<i>Анализ объемов и ликвидности</i>", 
    { parse_mode: 'HTML' }
  );

  const startTime = Date.now();
  const opportunities = await findEnhancedArbitrageOpportunities(0.1);
  const duration = Date.now() - startTime;

  let message = `⚡ <b>Улучшенная проверка арбитража</b>\n\n`;
  message += `⏱️ <i>Проверено за ${duration}мс</i>\n`;
  message += `📊 <i>Проанализировано ${ACTIVE_SYMBOLS.length} монет</i>\n\n`;

  if (opportunities.length === 0) {
    message += "📭 Арбитражных возможностей не найдено\n";
    message += "💡 Попробуйте уменьшить минимальную прибыль в настройках";
  } else {
    opportunities.slice(0, 8).forEach((opp, index) => {
      const emoji = index === 0 ? '🔥' : index < 3 ? '⚡' : '💰';
      message += `${emoji} <b>${getSymbolName(opp.symbol)}</b>\n`;
      message += `   📉 ${opp.buyExchange.icon} ${opp.buyExchange.name}: ${formatPrice(opp.buyPrice)}\n`;
      message += `   📈 ${opp.sellExchange.icon} ${opp.sellExchange.name}: ${formatPrice(opp.sellPrice)}\n`;
      message += `   💰 <b>Прибыль: ${opp.profit.toFixed(2)}%</b>\n`;
      message += `   📊 Объем: $${formatVolume(opp.volume)}\n\n`;
    });
  }

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'HTML'
  });
}

async function showTopArbitrage(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "🔥 <b>Поиск лучших арбитражных возможностей...</b>", 
    { parse_mode: 'HTML' }
  );

  try {
    const opportunities = await findEnhancedArbitrageOpportunities(0.5); // Минимум 0.5%
    
    let message = "🔥 <b>ТОП АРБИТРАЖНЫЕ ВОЗМОЖНОСТИ</b>\n\n";
    
    if (opportunities.length === 0) {
      message += "📭 Высокодоходных возможностей не найдено\n";
      message += "💡 Проверьте быстрый арбитраж для большего охвата";
    } else {
      const topOpps = opportunities.slice(0, 5);
      
      topOpps.forEach((opp, index) => {
        const stars = '⭐'.repeat(Math.min(index + 1, 3));
        message += `${stars} <b>${getSymbolName(opp.symbol)}</b> ${stars}\n`;
        message += `   🏪 Покупка: ${opp.buyExchange.icon} ${opp.buyExchange.name}\n`;
        message += `   🏪 Продажа: ${opp.sellExchange.icon} ${opp.sellExchange.name}\n`;
        message += `   💰 Прибыль: <b><u>${opp.profit.toFixed(2)}%</u></b>\n`;
        message += `   📊 Объем: $${formatVolume(opp.volume)}\n`;
        message += `   ⚡ Разница: ${formatPrice(opp.sellPrice - opp.buyPrice)}\n\n`;
      });
      
      message += `📈 <i>Лучшая возможность: ${topOpps[0].profit.toFixed(2)}% на ${getSymbolName(topOpps[0].symbol)}</i>`;
    }

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    bot.editMessageText("❌ Ошибка поиска возможностей", {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
}

// ==================== ОПТИМИЗИРОВАННЫЙ АРБИТРАЖ ====================
// ==================== УЛУЧШЕННЫЙ АРБИТРАЖНЫЙ АЛГОРИТМ ====================

async function findEnhancedArbitrageOpportunities(minProfit = 0.1) {
  const opportunities = [];
  const batchSize = 8; // Уменьшили батч для стабильности
  
  for (let i = 0; i < ACTIVE_SYMBOLS.length; i += batchSize) {
    const batch = ACTIVE_SYMBOLS.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (symbol) => {
      try {
        const prices = await getAllEnhancedExchangePrices(symbol);
        if (prices.length < 2) return null;

        // Сортируем по цене
        prices.sort((a, b) => a.price - b.price);
        const bestBuy = prices[0];
        const bestSell = prices[prices.length - 1];
        
        // Рассчитываем прибыль с учетом комиссий (0.15%)
        const profit = ((bestSell.price - bestBuy.price) / bestBuy.price * 100) - 0.15;
        
        // Проверяем минимальную прибыль и что это разные биржи
        if (profit >= minProfit && bestBuy.name !== bestSell.name) {
          // Получаем объем для лучшей биржи покупки
          const volume = await getExchangeVolume(symbol, bestBuy.name);
          
          return {
            symbol,
            buyExchange: bestBuy,
            sellExchange: bestSell,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            profit: profit,
            volume: volume,
            exchangesCount: prices.length,
            timestamp: Date.now()
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

    // Пауза между батчами для стабильности
    if (i + batchSize < ACTIVE_SYMBOLS.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Сортируем по прибыли и фильтруем по объему
  return opportunities
    .filter(opp => opp.volume > 10000) // Минимальный объем $10k
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);
}

async function getAllEnhancedExchangePrices(symbol) {
  const supportedExchanges = Object.entries(EXCHANGES)
    .filter(([, exchange]) => 
      exchange.supportedSymbols.includes(symbol) || 
      exchange.supportedSymbols === CRYPTO_SYMBOLS
    )
    .sort(([,a], [,b]) => b.weight - a.weight)
    .slice(0, 6); // Берем топ-6 самые надежные

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
        weight: exchange.weight,
        key: key
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

async function getExchangeVolume(symbol, exchangeName) {
  const cacheKey = `volume_${exchangeName}_${symbol}`;
  const cached = volumeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < 60000)) {
    return cached.volume;
  }

  try {
    const exchange = Object.values(EXCHANGES).find(e => e.name === exchangeName);
    if (!exchange?.volume) return 0;

    const data = await enhancedRequest(exchange.volume(symbol), cacheKey, 2000);
    const volume = exchange.volumeParser(data);
    
    volumeCache.set(cacheKey, { volume, timestamp: Date.now() });
    return volume;
  } catch (error) {
    return 0;
  }
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
      const opportunities = await findEnhancedArbitrageOpportunities(userSettings.minProfit);
      
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

// ==================== ДОБАВЛЯЕМ НЕДОСТАЮЩИЕ ФУНКЦИИ ====================

async function getPriceFromExchange(apiUrl, exchangeKey, symbol) {
  const cacheKey = `${exchangeKey}_${symbol}`;
  const data = await enhancedRequest(apiUrl, cacheKey, 1500);
  
  if (!data) throw new Error('No data');
  
  const exchange = EXCHANGES[exchangeKey];
  const price = exchange.parser(data);
  
  if (!price || price <= 0) throw new Error('Invalid price');
  return price;
}

function formatVolume(volume) {
  if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M';
  if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K';
  return volume.toFixed(0);
}

function toggleEnhancedArbitrage(chatId) {
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

function showEnhancedStats(chatId) {
  const stats = arbitrageStats.get(chatId) || { found: 0, checks: 0 };
  const userSettings = arbitrageUsers.get(chatId);
  
  const message = `
📊 <b>УЛУЧШЕННАЯ СТАТИСТИКА СИСТЕМЫ</b>

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
   ⏱️ Время проверки: 1-2 секунды

🎪 <b>Категории монет:</b>
   • Топ-50 по капитализации
   • 25+ мем-коинов (высокая волатильность)
   • DeFi токены
   • AI сектор (20+ токенов)
   • Gaming/Metaverse
   • Layer 2 решения
   • RWA (Real World Assets)
   • Новые перспективные

💡 <b>Рекомендации:</b>
• Используйте 0.1-0.3% для максимального охвата
• Мем-коины дают больше арбитражных возможностей
• AI токены - перспективный сектор
• Проверяйте ликвидность перед сделкой
  `;

  bot.sendMessage(chatId, message, { 
    parse_mode: 'HTML',
    ...mainKeyboard 
  });
}

function sendEnhancedSettings(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || { minProfit: 0.3, notifications: true };
  
  const message = `
⚙️ <b>УЛУЧШЕННЫЕ НАСТРОЙКИ АРБИТРАЖА</b>

Текущие настройки:
• 🎯 Минимальная прибыль: ${userSettings.minProfit}%
• 🔔 Уведомления: ${userSettings.notifications ? 'ВКЛ' : 'ВЫКЛ'}

Выберите минимальную прибыль для уведомлений:
<code>0.1% - Максимальная чувствительность (300+ монет)
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
🆘 <b>ПОМОЩЬ ПО УЛУЧШЕННОМУ АРБИТРАЖНОМУ БОТУ</b>

⚡ <b>Масштаб системы:</b>
• <b>${CRYPTO_SYMBOLS.length}+ монет</b> в базе данных
• <b>${Object.keys(EXCHANGES).length} бирж</b> в реальном времени  
• <b>${ACTIVE_SYMBOLS.length} активных монет</b> в проверке
• Все категории: от Bitcoin до AI токенов

🎯 <b>Новые категории монет:</b>
• ₿ <b>Голубые фишки</b> (BTC, ETH, BNB) - стабильность
• 🐶 <b>Мем-коины</b> (25+ токенов) - высокая волатильность
• 🤖 <b>AI токены</b> (20+ проектов) - будущее технологий
• 🎮 <b>Gaming/Metaverse</b> - растущий сектор
• 🌐 <b>RWA</b> - реальные активы
• 🔷 <b>DeFi</b> - децентрализованные финансы

🔥 <b>Новые функции:</b>
• <b>Топ арбитраж</b> - только лучшие возможности
• <b>Поиск монет</b> - мгновенная проверка любой пары
• <b>Анализ бирж</b> - сравнение и статистика
• <b>Анализ объемов</b> - безопасные сделки

💡 <b>Стратегии:</b>
• <b>Мем-коины</b> - больше арбитражных возможностей
• <b>AI токены</b> - перспективный рост
• <b>Новые токены</b> - высокая волатильность
• <b>Голубые фишки</b> - меньше риска

🏪 <b>Поддерживаемые биржи:</b>
🟡 Binance, 🔵 Bybit, 🟠 MEXC, 🔵 KuCoin, 🔷 OKX, 
🟣 Gate.io, 🟠 Huobi, 🔵 Bitget

⏱️ <i>Система проверяет ${ACTIVE_SYMBOLS.length} монет каждые 2 секунды</i>
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

async function showExchanges(chatId) {
  const message = `
🏪 <b>АНАЛИЗ БИРЖ</b>

📊 <b>Подключенные биржи:</b>
${Object.values(EXCHANGES).map(ex => 
  `   ${getExchangeIcon(ex.name)} ${ex.name} (вес: ${ex.weight}/10)`
).join('\n')}

💡 <b>Что можно сделать:</b>
• <b>Все биржи</b> - полный список с поддержкой
• <b>Топ биржи</b> - лучшие по скорости и надежности  
• <b>Объемы</b> - анализ торговых объемов

👇 <b>Выберите опцию:</b>
  `;

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...exchangeKeyboard
  });
}

async function showAllExchanges(chatId) {
  let message = "🏪 <b>ВСЕ ПОДКЛЮЧЕННЫЕ БИРЖИ</b>\n\n";
  
  Object.values(EXCHANGES).forEach((exchange, index) => {
    message += `${index + 1}. ${getExchangeIcon(exchange.name)} <b>${exchange.name}</b>\n`;
    message += `   ⚖️ Вес: ${exchange.weight}/10\n`;
    message += `   💰 Монет: ${exchange.supportedSymbols === CRYPTO_SYMBOLS ? 'Все' : exchange.supportedSymbols.length}\n`;
    message += `   🚀 API: ${exchange.weight >= 8 ? 'Быстрое' : 'Стабильное'}\n\n`;
  });

  message += `📈 <i>Всего бирж: ${Object.keys(EXCHANGES).length}</i>`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...exchangeKeyboard
  });
}

async function showTopExchanges(chatId) {
  const topExchanges = Object.values(EXCHANGES)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  let message = "🏆 <b>ТОП-3 БИРЖИ ДЛЯ АРБИТРАЖА</b>\n\n";
  
  topExchanges.forEach((exchange, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    message += `${medal} ${getExchangeIcon(exchange.name)} <b>${exchange.name}</b>\n`;
    message += `   ⚖️ Вес: ${exchange.weight}/10\n`;
    message += `   💰 Монет: ${exchange.supportedSymbols === CRYPTO_SYMBOLS ? 'Все' : exchange.supportedSymbols.length}+\n`;
    message += `   🚀 Скорость: ${exchange.weight >= 9 ? 'Максимальная' : 'Высокая'}\n\n`;
  });

  message += "💡 <b>Рекомендация:</b>\n";
  message += "Используйте топ-3 биржи для самых быстрых и надежных сделок";

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...exchangeKeyboard
  });
}

async function showVolumeAnalysis(chatId) {
  const loadingMsg = await bot.sendMessage(chatId, 
    "📊 <b>Анализ торговых объемов...</b>", 
    { parse_mode: 'HTML' }
  );

  try {
    // Проверяем объемы для топ-5 монет
    const topSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'DOGEUSDT'];
    const volumeData = [];

    for (const symbol of topSymbols) {
      const volume = await getExchangeVolume(symbol, 'Binance');
      volumeData.push({ symbol, volume });
    }

    volumeData.sort((a, b) => b.volume - a.volume);

    let message = "📊 <b>АНАЛИЗ ТОРГОВЫХ ОБЪЕМОВ</b>\n\n";
    message += "<i>Топ-5 монет по объемам (Binance)</i>\n\n";

    volumeData.forEach((data, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
      message += `${medal} <b>${getSymbolName(data.symbol)}</b>\n`;
      message += `   📈 Объем: $${formatVolume(data.volume)}\n\n`;
    });

    message += "💡 <b>Что это значит:</b>\n";
    message += "• Высокие объемы = лучше ликвидность\n";
    message += "• Низкие объемы = выше риски\n";
    message += "• Для арбитража выбирайте монеты с объемом > $100K";

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    await bot.editMessageText("❌ Ошибка анализа объемов", {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
}


console.log(`✅ Улучшенный арбитражный бот полностью готов!`);
console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
console.log(`🏪 Подключено бирж: ${Object.keys(EXCHANGES).length}`);
console.log(`⚡ Алгоритм: Улучшенный с анализом объемов`);


