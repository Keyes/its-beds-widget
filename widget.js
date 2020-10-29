/* Licence: juliankern.com; CC BY 3.0 DE */
const apiUrlBase = 'https://intensiv-widget.juliankern.com/beds';
const getApiUrl = (location, state) => {
  if (location) { return `${apiUrlBase}?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}`; }
  if (state) { return `${apiUrlBase}?state=${state}`; }
  return apiUrlBase;
}

const defaultCfg = {
  layout: 'simple',
};

const CONFIG = Object.assign({}, defaultCfg, arguments[0]);

init();

async function init() {
  if (CONFIG.debug) console.log('init called');
  const widget = await createWidget();
  if (!config.runsInWidget) await widget.presentSmall();

  Script.setWidget(widget);
  Script.complete();

  if (CONFIG.debug) console.log('complete');
}

async function createWidget(items) {
  if (CONFIG.debug) console.log('createWidget called');

  const data = await getData();
  const list = new ListWidget();
  // list.setPadding(20,-20,20,-20);

  if (CONFIG.debug) console.log('data received');

  const header = newStack(list, 4);

  addIcon('stethoscope', header, 13, Color.white());

  const headerText = header.addText('Freie ITS-Betten');
  headerText.font = Font.mediumSystemFont(12);

  if (CONFIG.debug) console.log('base constructed');

  if (data) {
    list.addSpacer();

    let weekData = { 
      overall: saveLoadData(data.overall, 'DE')
    };
    
    if (data.state) {
      weekData.state = saveLoadData(data.state, data.state.shortName);

      if (CONFIG.debug) {
        console.log('render state datablock');
        console.log(data.state);
        console.log(weekData.state);
      }

      renderDatablock(list, data.state, weekData.state);
      
      list.addSpacer(4);
    }

    if (CONFIG.debug) {
      console.log('render overall datablock');
      console.log(data.overall);
      console.log(weekData.overall);
    }

    renderDatablock(list, data.overall, weekData.overall);

    list.refreshAfterDate = new Date(Date.now() + (1000 * 60 * 30));

    if (CONFIG.debug) console.log('render updated block');

    list.addSpacer(6);
    const dateFormatter = new DateFormatter();
    dateFormatter.useShortDateStyle();
    dateFormatter.useShortTimeStyle();

    const updatedLabel = list.addText(`↻ ${dateFormatter.string(new Date(data.overall.updated))}`);
    updatedLabel.font = Font.regularSystemFont(9);
    updatedLabel.textColor = Color.gray();
  } else {
    list.addSpacer();
    list.addText("Daten nicht verfügbar");
  }

  return list;
}

function renderDatablock(list, data, weekData) {
  const percentLabel = newStack(list, 4);
  const datablockColor = getPercentageColor(data.used);

  if (CONFIG.debug) console.log('render percentLabel');

  // const label = percentLabel.addText(`${data.used.toFixed(2)}% ${getBedsTrend(data, weekData)}`);
  const label = percentLabel.addText(`${data.used.toFixed(2)}%`);
  label.font = Font.mediumSystemFont(22);
  label.textColor = datablockColor;
  
  const trendIconName = getBedsTrendIcon(data, weekData);

  if (CONFIG.debug) {
    console.log('render trend icon');
    console.log(trendIconName);
  }

  if (trendIconName) {
    addIcon(trendIconName, percentLabel, 15, datablockColor);
  }

  if (CONFIG.debug) console.log('render number stack');

  const bedsLabel = newStack(list, 2);

  if (CONFIG.layout === 'extended') {
    if (CONFIG.debug) console.log('render extended datablock');

    const location = bedsLabel.addText((data.shortName || 'DE'));
    location.font = Font.semiboldSystemFont(10);
    // location.textColor = Color.lightGray();

    if (CONFIG.debug) console.log('absolute numbers');

    const absoluteLabel = bedsLabel.addText(`${data.absolute.free}/${data.absolute.total}`);
    absoluteLabel.font = Font.mediumSystemFont(10);
    absoluteLabel.textColor = datablockColor;

    const bedTrendsAbsolute = getBedsTrendAbsolute(data, weekData);

    if (CONFIG.debug) {
      console.log('relative number');
      console.log(bedTrendsAbsolute);
    }

    const relativeLabel = bedsLabel.addText(bedTrendsAbsolute);
    relativeLabel.font = Font.mediumSystemFont(10);
    relativeLabel.textColor = Color.gray();
  } else {
    if (CONFIG.debug) console.log('render simple datablock');

    const location = bedsLabel.addText(data.name || 'Deutschland');
    location.font = Font.lightSystemFont(12);
  }

  if (CONFIG.debug) console.log('render datablock complete');
}

function getPercentageColor(value) {
  return value <= 25 ? Color.red() : value <= 50 ? Color.orange() : Color.green();
}

async function getData() {
  try {
    if (CONFIG.debug) console.log('try getting data');

    let foundData;
    
    if (args.widgetParameter) {
      foundData = await new Request(getApiUrl(null, args.widgetParameter)).loadJSON();
    } else {
      const location = await getLocation();
      foundData = await new Request(getApiUrl(location)).loadJSON();
    }

    return foundData;
  } catch (e) {
    if (CONFIG.debug) { 
      console.log('error getting data');
      console.log(e);
    }

    return null;
  }
}

async function getLocation() {
  try {
    if (CONFIG.debug) console.log('try getting location');

    Location.setAccuracyToThreeKilometers();
    return await Location.current();
  } catch (e) {
    if (CONFIG.debug) {
      console.log('error getting location');
      console.log(e);
    }

    return null;
  }
}

function getBedsTrend(data, weekdata) {
  let bedsTrend = ' ';
  
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);
  
    if (prevData) bedsTrend = (data.absolute.free === prevData.absolute.free) ? ' ' : ((data.absolute.free < prevData.absolute.free) ? '↓' : '↑');
  }
  
  return bedsTrend;
}

function getBedsTrendIcon(data, weekdata) {
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);

    if (prevData) {
      if (data.absolute.free === prevData.absolute.free) return;
      if (data.absolute.free < prevData.absolute.free) return 'chevron.down';
      else return 'chevron.up';
    }
  }
}

function getBedsTrendAbsolute(data, weekdata) {
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);

    if (CONFIG.debug) {
      console.log('getBedsTrendAbsolute');
      console.log(prevData);
    }

    if (prevData) {
      let bedsTrend = (data.absolute.free - prevData.absolute.free);

      if (CONFIG.debug) {
        console.log(bedsTrend);
      }

      if (bedsTrend === 0) return '';
      if (bedsTrend > 0) bedsTrend = `+${bedsTrend}`;

      return ` (${bedsTrend})`;
    }
  }

  return '';
}

function getDataForDate(weekdata, yesterday = true, datestr = '') {
  let dateKey = datestr;
  let dayOffset = 1;
  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  if (CONFIG.debug) {
    console.log('getDataForDate');
    console.log(todayDateKey);
  }

  if (typeof weekdata[todayDateKey] === 'undefined') dayOffset = 2;

  if (yesterday) {
    today.setDate(today.getDate() - dayOffset);
    dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  if (CONFIG.debug) {
    console.log(dateKey);
    console.log('getDataForDate result:');
    // console.log(weekdata[dateKey]);
  }

  if (typeof weekdata[dateKey] !== 'undefined') return weekdata[dateKey];

  return false;
}

function saveLoadData(newData, suffix = '') {
  const updated = newData.updated.substr(0, 10);
  const loadedData = loadData(suffix);

  if (loadedData) {
    loadedData[updated] = newData;

    const loadedDataKeys = Object.keys(loadedData);
    const lastDaysKeys = loadedDataKeys.slice(Math.max(Object.keys(loadedData).length - 7, 0));

    let loadedDataLimited = {};
    lastDaysKeys.forEach(key => loadedDataLimited[key] = loadedData[key]);

    const { fm, path } = getFM(suffix);
    fm.writeString(path, JSON.stringify(loadedDataLimited))

    return loadedData;
  }

  return {};
}

function loadData(suffix) {
  const { fm, path } = getFM(suffix);

  if (fm.fileExists(path)) {
    const data = fm.readString(path);
    return JSON.parse(data);
  }

  return {};
}

function getFM(suffix) {
  let fm, path;

  try {
    fm = FileManager.iCloud();
    path = getFilePath(fm, suffix);
  } catch (e) {
    fm = FileManager.local();
    path = getFilePath(fm, suffix);
  }

  return { fm, path };
}

function addIcon(iconName, parent, size, color) {
  const widgetIcon = SFSymbol.named(iconName);
  widgetIcon.applyFont(Font.mediumSystemFont(22));

  const widgetIconImage = parent.addImage(widgetIcon.image);
  if (color) widgetIconImage.tintColor = color;
  widgetIconImage.imageSize = new Size(size, size);
  widgetIconImage.resizeable = false;
}

function newStack(parent, spacing) {
  const createdStack = parent.addStack();
  createdStack.layoutHorizontally();
  createdStack.centerAlignContent();
  createdStack.setPadding(0, 0, 0, 0);
  createdStack.spacing = spacing;

  return createdStack;
}

function getFilePath(fm, suffix) {
  return fm.joinPath(fm.documentsDirectory(), `its-beds-${suffix}.json`)
}
