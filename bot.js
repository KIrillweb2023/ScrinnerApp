import { configDotenv } from 'dotenv';
configDotenv();
import TelegramBot from "node-telegram-bot-api";
import WebSocket from 'ws';
import express from "express";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

const app = express();
const bot = new TelegramBot(TOKEN);

// Middleware
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Запуск сервера
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  
  if (RAILWAY_PUBLIC_DOMAIN) {
    const webhookUrl = `https://${RAILWAY_PUBLIC_DOMAIN}/webhook`;
    try {
      await bot.setWebHook(webhookUrl);
      console.log(`✅ Webhook установлен: ${webhookUrl}`);
    } catch (error) {
      console.error('❌ Ошибка webhook, переключаюсь на polling');
      bot.startPolling();
    }
  } else {
    console.log('⚠️ Использую polling');
    bot.startPolling();
  }
});


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


const EXCHANGE_WS_CONFIGS = {
  BINANCE: {
    name: 'Binance',
    weight: 10,
    wsUrl: 'wss://stream.binance.com:9443/ws',
    streams: ACTIVE_SYMBOLS.map(sym => `${sym.toLowerCase()}@ticker`),
    parser: (data) => {
      if (data.e === '24hrTicker') {
        return {
          symbol: data.s,
          price: parseFloat(data.c),
          volume: parseFloat(data.v),
          timestamp: data.E
        };
      }
      return null;
    }
  },
  BYBIT: {
    name: 'Bybit',
    weight: 9,
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    streams: ACTIVE_SYMBOLS.map(sym => `tickers.${sym}`),
    parser: (data) => {
      if (data.topic?.includes('tickers') && data.data) {
        return {
          symbol: data.data.symbol,
          price: parseFloat(data.data.lastPrice),
          volume: parseFloat(data.data.volume24h),
          timestamp: Date.now()
        };
      }
      return null;
    }
  },
  MEXC: {
    name: 'MEXC',
    weight: 8,
    wsUrl: 'wss://wbs.mexc.com/ws',
    streams: ACTIVE_SYMBOLS.map(sym => `spot@public.miniTicker.v3.api@${sym}@UTC+8`),
    parser: (data) => {
      if (data.channel === 'spot@public.miniTicker.v3.api' && data.data) {
        return {
          symbol: data.symbol,
          price: parseFloat(data.data.c),
          volume: parseFloat(data.data.v),
          timestamp: data.data.t
        };
      }
      return null;
    }
  }
};

class WebSocketPriceManager {
  constructor() {
    this.connections = new Map();
    this.priceData = new Map(); // symbol -> {exchange -> price}
    this.subscribers = new Map(); // chatId -> callback
    this.setupConnections();
  }

  setupConnections() {
    Object.entries(EXCHANGE_WS_CONFIGS).forEach(([exchange, config]) => {
      this.setupExchangeConnection(exchange, config);
    });
  }

  setupExchangeConnection(exchangeName, config) {
    try {
      const ws = new WebSocket(config.wsUrl);
      
      ws.on('open', () => {
        console.log(`✅ WebSocket подключен: ${exchangeName}`);
        
        // Подписка на стримы
        if (exchangeName === 'BINANCE') {
          const subscribeMsg = {
            method: "SUBSCRIBE",
            params: config.streams,
            id: 1
          };
          ws.send(JSON.stringify(subscribeMsg));
        } else if (exchangeName === 'BYBIT') {
          config.streams.forEach(stream => {
            const subscribeMsg = {
              op: "subscribe",
              args: [stream]
            };
            ws.send(JSON.stringify(subscribeMsg));
          });
        } else if (exchangeName === 'MEXC') {
          config.streams.forEach(stream => {
            const subscribeMsg = {
              method: "SUBSCRIPTION", 
              params: [stream]
            };
            ws.send(JSON.stringify(subscribeMsg));
          });
        }
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data);
          const tickerData = config.parser(parsed);
          
          if (tickerData && tickerData.price > 0) {
            this.updatePrice(tickerData.symbol, exchangeName, tickerData.price);
          }
        } catch (error) {
          console.error(`Ошибка парсинга данных от ${exchangeName}:`, error.message);
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket ошибка ${exchangeName}:`, error.message);
      });

      ws.on('close', () => {
        console.log(`🔴 WebSocket отключен: ${exchangeName}`);
        // Переподключение через 5 секунд
        setTimeout(() => this.setupExchangeConnection(exchangeName, config), 5000);
      });

      this.connections.set(exchangeName, ws);
    } catch (error) {
      console.error(`Ошибка подключения к ${exchangeName}:`, error.message);
    }
  }

  updatePrice(symbol, exchange, price) {
    if (!this.priceData.has(symbol)) {
      this.priceData.set(symbol, new Map());
    }
    
    const symbolData = this.priceData.get(symbol);
    symbolData.set(exchange, {
      price,
      timestamp: Date.now()
    });

    // Уведомляем подписчиков о новых данных
    this.notifySubscribers(symbol, exchange, price);
  }

  subscribe(chatId, callback) {
    this.subscribers.set(chatId, callback);
  }

  unsubscribe(chatId) {
    this.subscribers.delete(chatId);
  }

  notifySubscribers(symbol, exchange, price) {
    this.subscribers.forEach((callback, chatId) => {
      callback(symbol, exchange, price);
    });
  }

  getPrices(symbol) {
    const symbolData = this.priceData.get(symbol);
    if (!symbolData) return [];
    
    const prices = [];
    for (const [exchange, data] of symbolData.entries()) {
      // Проверяем актуальность данных (не старше 10 секунд)
      if (Date.now() - data.timestamp < 10000) {
        prices.push({
          exchange: EXCHANGE_WS_CONFIGS[exchange].name,
          icon: getExchangeIcon(EXCHANGE_WS_CONFIGS[exchange].name),
          price: data.price,
          weight: EXCHANGE_WS_CONFIGS[exchange].weight
        });
      }
    }
    
    return prices.sort((a, b) => a.price - b.price);
  }

  getAllSymbols() {
    return Array.from(this.priceData.keys());
  }
}

const priceManager = new WebSocketPriceManager();

const arbitrageUsers = new Map();
const arbitrageStats = new Map();

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


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMessage = `
🚀 <b>АРБИТРАЖНЫЙ БОТ </b>

⚡ <b>Основные возможности:</b>
• 🔥 ${CRYPTO_SYMBOLS.length}+ монет в базе
• 🏪 ${Object.keys(EXCHANGE_WS_CONFIGS).length} бирж в реальном времени
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
    `🔍 <b>Поиск монеты: ${symbol.replace('USDT', '')} </b>`, 
    { parse_mode: 'HTML' }
  );

  try {
    const prices = priceManager.getPrices(symbol);
    
    if (prices.length === 0) {
      await bot.editMessageText(
        `❌ <b>Монета не найдена или нет данных</b>\n\n` +
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
      message += `${medal} ${exchange.icon} <b>${exchange.exchange}</b>\n`;
      message += `   💵 ${formatPrice(exchange.price)}\n`;
      if (index === 0) message += `   🏆 <i>Лучшая цена для покупки</i>\n`;
      if (index === prices.length - 1) message += `   💰 <i>Лучшая цена для продажи</i>\n`;
      message += '\n';
    });

    const bestBuy = prices[0];
    const bestSell = prices[prices.length - 1];
    const profit = ((bestSell.price - bestBuy.price) / bestBuy.price * 100) - 0.15;

    message += `⚡ <b>АРБИТРАЖНЫЙ АНАЛИЗ:</b>\n`;
    message += `   📉 Купить на: ${bestBuy.icon} ${bestBuy.exchange}\n`;
    message += `   📈 Продать на: ${bestSell.icon} ${bestSell.exchange}\n`;
    message += `   💰 Прибыль: <b>${profit.toFixed(2)}%</b>\n`;
    message += `\n⏱️ <i>Данные через WebSocket (актуальные)</i>`;

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
    "⚡ <b>Загрузка актуальных цен через WebSocket...</b>", 
    { parse_mode: 'HTML' }
  );

  try {
    let message = "💰 <b>Мгновенные цены </b>\n\n";
    let count = 0;
    
    for (const symbol of ACTIVE_SYMBOLS.slice(0, 20)) {
      const prices = priceManager.getPrices(symbol);
      if (prices.length > 0) {
        const bestPrice = prices[0]; // Самая низкая цена
        count++;
        message += `${getCryptoIcon(symbol)} <b>${getSymbolName(symbol)}</b>\n`;
        message += `   💵 ${formatPrice(bestPrice.price)} (${bestPrice.icon} ${bestPrice.exchange})\n`;
        
        if (count % 3 === 0) message += '\n';
      }
    }

    message += `\n⏱️ <i>Актуальные данные через WebSocket</i>`;
    message += `\n📊 <i>Всего в базе: ${priceManager.getAllSymbols().length} монет</i>`;

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
      const prices = priceManager.getPrices(symbol);
      if (prices.length < 2) continue;

      // Сортируем по цене
      const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
      const bestBuy = sortedPrices[0];
      const bestSell = sortedPrices[sortedPrices.length - 1];
      
      const priceDifference = bestSell.price - bestBuy.price;
      const profitPercentage = (priceDifference / bestBuy.price) * 100;
      const netProfit = profitPercentage - 0.2;
      
      const isDifferentExchange = bestBuy.exchange !== bestSell.exchange;
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
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 8);
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
        
        for (const opp of opportunities) {
          const opportunityKey = `${opp.symbol}_${Math.round(opp.profit * 100)}`;
          
          if (Date.now() - userSettings.lastNotification > 30000 || 
              !userSettings.lastOpportunity || 
              userSettings.lastOpportunity !== opportunityKey) {
            
            await sendArbitrageNotification(chatId, opp, checkCount);
            userSettings.lastNotification = Date.now();
            userSettings.lastOpportunity = opportunityKey;
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      // Статистика каждые 10 проверок
      if (checkCount % 10 === 0) {
        const successRate = stats.checks > 0 ? ((stats.found / stats.checks) * 100).toFixed(1) : 0;
        await bot.sendMessage(chatId,
          `🔍 <b>Мониторинг активен </b>\n` +
          `📊 Проверок: ${stats.checks}\n` +
          `🎯 Найдено: ${stats.found}\n` +
          `📈 Успешность: ${successRate}%\n` +
          `⚡ Следующая проверка через 1с...`,
          { parse_mode: 'HTML' }
        );
      }

    } catch (error) {
      console.error('Monitor error:', error.message);
    }

    if (userSettings.active) {
      setTimeout(monitor, 1000); // Увеличиваем частоту проверок до 1 секунды
    }
  };

  monitor();
}


async function sendArbitrageNotification(chatId, opp, checkCount) {
  const message = `
🎯 <b>АРБИТРАЖ #${checkCount} </b>

${getCryptoIcon(opp.symbol)} <b>${getSymbolName(opp.symbol)}</b>

🔼 <b>ПОКУПКА:</b> ${opp.buyExchange.icon} ${opp.buyExchange.exchange}
   💵 ${formatPrice(opp.buyPrice)}

🔽 <b>ПРОДАЖА:</b> ${opp.sellExchange.icon} ${opp.sellExchange.exchange}  
   💵 ${formatPrice(opp.sellPrice)}

💰 <b>ПРИБЫЛЬ:</b> <u>${opp.profit.toFixed(3)}%</u>
📐 <b>Разница:</b> ${formatPrice(opp.priceDifference)}

⚡ <b>ДЕЙСТВИЯ:</b>
1. Купить на ${opp.buyExchange.exchange}
2. Перевести на ${opp.sellExchange.exchange}
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
    `✅ <b>НАСТРОЙКИ ОБНОВЛЕНЫ </b>\n\n` +
    `🎯 Минимальная прибыль: <b>${profit}%</b>\n\n` +
    `Теперь вы будете получать уведомления о сделках с прибылью от ${profit}%`,
    { parse_mode: 'HTML', ...mainKeyboard }
  );
}


function getCryptoIcon(symbol) {
  const icons = {
    'BTCUSDT': '₿', 'ETHUSDT': '🔷', 'BNBUSDT': '🟡', 'SOLUSDT': '🔆', 'XRPUSDT': '✖️',
    'DOGEUSDT': '🐕', 'ADAUSDT': '🔷', 'AVAXUSDT': '❄️', 'DOTUSDT': '🟣', 'LINKUSDT': '🔗',
    'SHIBUSDT': '🐶', 'PEPEUSDT': '🐸', 'FLOKIUSDT': '🐺', 'BONKUSDT': '🐕', 'WIFUSDT': '🧢',
    'MEMEUSDT': '🖼️', 'BOMEUSDT': '📚', 'POPCATUSDT': '🐱', 'MYROUSDT': '🦴', 'DOGSUSDT': '🐶',
    'FETUSDT': '🤖', 'AGIXUSDT': '🧠', 'RNDRUSDT': '🎨', 'TAOUSDT': '🔮', 'OCEANUSDT': '🌊',
    'GALAUSDT': '🎮', 'SANDUSDT': '🏖️', 'MANAUSDT': '👾', 'AXSUSDT': '🪙', 'PIXELUSDT': '🎨',
    'JUPUSDT': '🪐', 'PYTHUSDT': '🐍', 'JTOUSDT': '⚡', 'PENDLEUSDT': '📈', 'ONDOUSDT': '🏦',
    'TIAUSDT': '🌐', 'SEIUSDT': '🌊', 'SUIUSDT': '💧', 'INJUSDT': '💉'
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
    'BTCUSDT': 'Bitcoin', 'ETHUSDT': 'Ethereum', 'BNBUSDT': 'BNB', 'SOLUSDT': 'Solana',
    'XRPUSDT': 'Ripple', 'DOGEUSDT': 'Dogecoin', 'ADAUSDT': 'Cardano', 'AVAXUSDT': 'Avalanche',
    'DOTUSDT': 'Polkadot', 'LINKUSDT': 'Chainlink', 'MATICUSDT': 'Polygon', 'LTCUSDT': 'Litecoin',
    'SHIBUSDT': 'Shiba Inu', 'PEPEUSDT': 'Pepe', 'FLOKIUSDT': 'Floki', 'BONKUSDT': 'Bonk',
    'WIFUSDT': 'dogwifhat', 'MEMEUSDT': 'Memecoin', 'BOMEUSDT': 'Book of Meme', 'POPCATUSDT': 'Popcat',
    'MYROUSDT': 'Myro', 'DOGSUSDT': 'Dogs',
    'FETUSDT': 'Fetch.ai', 'AGIXUSDT': 'SingularityNET', 'RNDRUSDT': 'Render', 'TAOUSDT': 'Bittensor',
    'OCEANUSDT': 'Ocean Protocol',
    'GALAUSDT': 'Gala', 'SANDUSDT': 'The Sandbox', 'MANAUSDT': 'Decentraland', 'AXSUSDT': 'Axie Infinity',
    'PIXELUSDT': 'Pixels',
    'JUPUSDT': 'Jupiter', 'PYTHUSDT': 'Pyth', 'JTOUSDT': 'Jito', 'PENDLEUSDT': 'Pendle', 'ONDOUSDT': 'Ondo',
    'TIAUSDT': 'Celestia', 'SEIUSDT': 'Sei', 'SUIUSDT': 'Sui', 'INJUSDT': 'Injective'
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
      `⚡ Проверка каждые 1 секунду\n` +
      `🔔 Умные уведомления\n` +
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
📊 <b>СТАТИСТИКА СИСТЕМЫ </b>

🎯 <b>Текущий статус:</b> ${userSettings?.active ? '🟢 АКТИВЕН' : '🔴 ВЫКЛЮЧЕН'}
📈 <b>Минимальная прибыль:</b> ${userSettings?.minProfit || 0.3}%

📈 <b>Эффективность:</b>
   🔍 Всего проверок: ${stats.checks}
   🎯 Найдено возможностей: ${stats.found}
   📊 Успешность: ${successRate}%
   ⏰ Последняя находка: ${lastFound}

⚡ <b>Масштаб системы:</b>
   🏪 Активных бирж: ${Object.keys(EXCHANGE_WS_CONFIGS).length}
   💰 Всего монет в базе: ${CRYPTO_SYMBOLS.length}
   🔥 Активных в проверке: ${ACTIVE_SYMBOLS.length}
   ⏱️ Интервал проверки: 1 секунда
  `;

  bot.sendMessage(chatId, message, { 
    parse_mode: 'HTML',
    ...mainKeyboard 
  });
}

function sendEnhancedSettings(chatId) {
  const userSettings = arbitrageUsers.get(chatId) || { minProfit: 0.3 };
  
  const message = `
⚙️ <b>НАСТРОЙКИ АРБИТРАЖА </b>

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
• <b>${Object.keys(EXCHANGE_WS_CONFIGS).length} бирж</b> 
• <b>${ACTIVE_SYMBOLS.length} активных монет</b> в проверке

🏪 <b>Поддерживаемые биржи:</b>
🟡 Binance, 🔵 Bybit, 🟠 MEXC

⏱️ <i>Система проверяет ${ACTIVE_SYMBOLS.length} монет каждые 1 секунду</i>
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

console.log(`✅ Арбитражный бот запущен`);
console.log(`📊 База данных: ${CRYPTO_SYMBOLS.length} монет`);
console.log(`🔥 Активный мониторинг: ${ACTIVE_SYMBOLS.length} монет`);
console.log(`🏪 WebSocket подключения: ${Object.keys(EXCHANGE_WS_CONFIGS).length} бирж`);
console.log(`⏱️ Интервал проверки: 1 секунда`);