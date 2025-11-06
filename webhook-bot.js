import { configDotenv } from 'dotenv';
configDotenv();
import TelegramBot from "node-telegram-bot-api";
import axios from 'axios';
import express from 'express';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://scrinnerapp-production.up.railway.app';
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

const bot = new TelegramBot(TOKEN, {
  request: {
    timeout: 30000,
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
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'LTCUSDT', 'ATOMUSDT', 'SHIBUSDT', 'PEPEUSDT',
  'ARBUSDT', 'OPUSDT', 'FETUSDT', 'AGIXUSDT', 'JUPUSDT',
  'PYTHUSDT', 'GALAUSDT', 'SANDUSDT', 'MANAUSDT', 'BONKUSDT'
];


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

const arbitrageUsers = new Map();
const arbitrageStats = new Map();
const requestCache = new Map();

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

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['💰 Все монеты', '🎯 Арбитраж ON/OFF'],
      ['📊 Статистика', '🔍 Поиск монеты'],
      ['⚙️ Настройки', 'ℹ️ Помощь', ]
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



async function findEnhancedArbitrageOpportunities(minProfit = 0.1) {
  const opportunities = [];
  
  for (const symbol of ACTIVE_SYMBOLS) {
    try {
      const prices = await getAllEnhancedExchangePrices(symbol);
      if (prices.length < 2) continue;

      
      prices.sort((a, b) => a.price - b.price);
      const bestBuy = prices[0];
      const bestSell = prices[prices.length - 1];
      
      
      const priceDifference = bestSell.price - bestBuy.price;
      const profitPercentage = (priceDifference / bestBuy.price) * 100;
      
      
      const netProfit = profitPercentage - 0.2;
      
      const isDifferentExchange = bestBuy.name !== bestSell.name;
      const isSignificantProfit = netProfit >= minProfit;
      const isPriceDifferenceSignificant = priceDifference > bestBuy.price * 0.0001; 
      
      if (isDifferentExchange && isSignificantProfit && isPriceDifferenceSignificant) {
        opportunities.push({
          symbol,
          buyExchange: bestBuy,
          sellExchange: bestSell,
          buyPrice: bestBuy.price,
          sellPrice: bestSell.price,
          profit: Number(netProfit.toFixed(3)), 
          priceDifference: Number(priceDifference.toFixed(6)),
          timestamp: Date.now()
        });
      }
    } catch (error) {
      continue;
    }
  }


  return opportunities
    .filter(opp => opp.profit > 0) 
    .sort((a, b) => {
     
      if (b.profit !== a.profit) return b.profit - a.profit;
      return b.priceDifference - a.priceDifference;
    }) .slice(0, 8);
}

async function getAllEnhancedExchangePrices(symbol) {
  const supportedExchanges = Object.entries(EXCHANGES)
    .filter(([, exchange]) => 
      exchange.supportedSymbols.includes(symbol) || 
      exchange.supportedSymbols === CRYPTO_SYMBOLS
    )
    .sort(([,a], [,b]) => b.weight - a.weight)
    .slice(0, 5);  

  const pricePromises = supportedExchanges.map(async ([key, exchange]) => {
    try {
      const price = await Promise.race([
        getPriceFromExchange(exchange.api(symbol), key, symbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1800))
      ]);
      
      if (!price || price <= 0 || price > 1000000) {
        return null;
      }
      
      return {
        name: exchange.name,
        icon: getExchangeIcon(exchange.name),
        price: Number(price.toFixed(8)), 
        weight: exchange.weight,
        key: key
      };
    } catch (error) {
      return null;
    }
  });

  const results = await Promise.allSettled(pricePromises);
  
  return results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value)
    .filter(exchange => exchange !== null && exchange.price > 0);
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
      }

      const now = Date.now();
      for (const opp of opportunities) {
        const opportunityKey = `${opp.symbol}_${Math.round(opp.profit * 100)}`; 
        
        if (now - userSettings.lastNotification > 45000 || 
            !userSettings.lastOpportunity || 
            userSettings.lastOpportunity !== opportunityKey) {
          
          await sendArbitrageNotification(chatId, opp, checkCount);
          userSettings.lastNotification = now;
          userSettings.lastOpportunity = opportunityKey;
          await new Promise(resolve => setTimeout(resolve, 500)); 
        }
      }

     
      if (checkCount % 15 === 0) { 
        const successRate = stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0;
        await bot.sendMessage(chatId,
          `🔍 <b>Мониторинг активен</b>\n` +
          `📊 Проверок: ${stats.checks}\n` +
          `🎯 Найдено: ${stats.found}\n` +
          `📈 Успешность: ${successRate}%\n` +
          `⚡ Следующая проверка через 3с...`,
          { parse_mode: 'HTML' }
        );
      }

    } catch (error) {
      console.error('Monitor error:', error.message);
    }

    if (userSettings.active) {
      setTimeout(monitor, 3000); 
    }
  };

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

💰 <b>ПРИБЫЛЬ:</b> <u>${opp.profit.toFixed(3)}%</u>
📐 <b>Разница:</b> ${formatPrice(opp.priceDifference)}

⚡ <b>ДЕЙСТВИЯ:</b>
1. Купить на ${opp.buyExchange.name}
2. Перевести на ${opp.sellExchange.name}
3. Продать с прибылью

⏰ ${new Date().toLocaleTimeString()}
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
    'Binance': '🟡', 'Bybit': '🔵', 'MEXC': '🟠',
    'KuCoin': '🔵', 'OKX': '🔷'
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

async function getPriceFromExchange(apiUrl, exchangeKey, symbol) {
  const cacheKey = `${exchangeKey}_${symbol}`;
  const data = await enhancedRequest(apiUrl, cacheKey, 1500);
  
  if (!data) throw new Error('No data');
  
  const exchange = EXCHANGES[exchangeKey];
  const price = exchange.parser(data);
  
  if (!price || price <= 0) throw new Error('Invalid price');
  return price;
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


// console.log(`✅ Арбитражный бот запущен!`);
// console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
// console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
// console.log(`🏪 Подключено бирж: ${Object.keys(EXCHANGES).length}`);
// console.log(`⏱️ Интервал проверки: 3 секунды`);

//  WEBHOOK  
app.post(`/bot${TOKEN}`, (req, res) => {
  console.log('📨 Получено сообщение от Telegram');
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Ошибка обработки сообщения:', error);
    res.sendStatus(200); // Всегда возвращаем 200 чтобы Telegram не отключал webhook
  }
});

// Проверка что сервер работает
app.get('/', (req, res) => {
  res.json({ 
    status: 'Arbitrage Bot is running!',
    users: arbitrageUsers.size,
    active_monitoring: Array.from(arbitrageUsers.values()).filter(user => user.active).length,
    timestamp: new Date().toISOString()
  });
});

// Health check для Railway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Установка webhook
async function setupWebhook() {
  try {
    const webhookUrl = `${WEBHOOK_URL}/bot${TOKEN}`;
    console.log('🔄 Устанавливаю webhook:', webhookUrl);
    
    await bot.setWebHook(webhookUrl);
    console.log('✅ Webhook установлен');
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка установки webhook:', error.message);
    return false;
  }
}

// Обработчик ошибок бота
bot.on('error', (error) => {
  console.error('❌ Ошибка Telegram Bot:', error);
});

// Логируем входящие сообщения
bot.on('message', (msg) => {
  console.log('💬 Получено сообщение от', msg.from?.username || msg.chat.id, ':', msg.text);
});

// Логируем отправку сообщений
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Запуск сервера
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Webhook сервер запущен на порту ${PORT}`);
  console.log(`🌐 Webhook URL: ${WEBHOOK_URL}/bot${TOKEN}`);
  console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
  console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
  console.log(`🏪 Подключено бирж: ${Object.keys(EXCHANGES).length}`);
  
  // Ждем перед установкой webhook
  setTimeout(async () => {
    const success = await setupWebhook();
    if (success) {
      console.log('🎉 Бот успешно запущен и готов к работе!');
    } else {
      console.log('⚠️ Бот запущен, но webhook не установлен. Проверьте настройки.');
    }
  }, 3000);
});

// ==================== KEEP ALIVE ====================

// Улучшенный keep-alive с логированием
let heartbeatCount = 0;
function startHeartbeat() {
  setInterval(() => {
    heartbeatCount++;
    const memoryUsage = process.memoryUsage();
    const activeUsers = Array.from(arbitrageUsers.values()).filter(user => user.active).length;
    
    if (heartbeatCount % 30 === 0) { // Логируем каждые 30 секунд
      console.log('💓 Heartbeat:', {
        uptime: Math.floor(process.uptime()),
        memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        activeUsers: activeUsers,
        totalUsers: arbitrageUsers.size
      });
    }
  }, 1000);
}

// Запускаем heartbeat
startHeartbeat();

// Обработчики для graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Получен SIGTERM, останавливаем бота...');
  arbitrageUsers.forEach((settings) => {
    settings.active = false;
  });
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Получен SIGINT, останавливаем бота...');
  arbitrageUsers.forEach((settings) => {
    settings.active = false;
  });
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

// Keep-alive чтобы контейнер не останавливался
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  // НЕ завершаем процесс!
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанный промис:', reason);
  // НЕ завершаем процесс!
});

console.log('✅ Приложение запущено и будет работать постоянно');