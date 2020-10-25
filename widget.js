/* Licence: juliankern.com; CC BY 3.0 DE */
const apiUrlBase = 'http://intensiv-widget.juliankern.com/beds';
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
  const widget = await createWidget();
  if (!config.runsInWidget) {
    await widget.presentSmall();
  }

  console.log(CONFIG.layout);

  Script.setWidget(widget);
  Script.complete();
}

async function createWidget(items) {
  const data = await getData();
  const list = new ListWidget();
  const header = list.addText("🛏 Freie ITS-Betten");
  header.font = Font.mediumSystemFont(12);

  if (data) {
    list.addSpacer();

    
    if (data.state) {
      const bedsLabel = list.addStack();
      bedsLabel.layoutHorizontally();
      bedsLabel.centerAlignContent();
      bedsLabel.useDefaultPadding();

      const label = bedsLabel.addText(data.state.used.toFixed(2) + "%");
      label.font = Font.mediumSystemFont(22);
      label.textColor = data.state.used <= 25 ? Color.red() : data.state.used <= 50 ? Color.orange() : Color.green();

      if (CONFIG.layout === 'extended') {
        const location = bedsLabel.addText(`.\n${data.state.shortName}`);
        location.font = Font.mediumSystemFont(9);
        location.textColor = Color.gray();

        const label = list.addText(`${data.state.absolute.free}/${data.state.absolute.total}`);
        label.font = Font.mediumSystemFont(12);
        label.textColor = data.state.used <= 25 ? Color.red() : data.state.used <= 50 ? Color.orange() : Color.green();
      } else {
        const location = list.addText(data.state.name);
        location.font = Font.lightSystemFont(12);
      }
      
      list.addSpacer(4);
    }

    const bedsLabel = list.addStack();
    bedsLabel.layoutHorizontally();
    bedsLabel.centerAlignContent();
    bedsLabel.useDefaultPadding();

    const label = bedsLabel.addText(data.overall.used.toFixed(2) + "%");
    label.font = Font.mediumSystemFont(22);
    label.textColor = data.overall.used <= 25 ? Color.red() : data.overall.used <= 50 ? Color.orange() : Color.green();
    
    if (CONFIG.layout === 'extended') {
      const location = bedsLabel.addText('.\nDE');
      location.font = Font.mediumSystemFont(9);
      location.textColor = Color.gray();

      const label = list.addText(`${data.overall.absolute.free}/${data.overall.absolute.total}`);
      label.font = Font.mediumSystemFont(12);
      label.textColor = data.overall.used <= 25 ? Color.red() : data.overall.used <= 50 ? Color.orange() : Color.green();
    } else {
      const location = list.addText('Deutschland');
      location.font = Font.lightSystemFont(12);
    }

    list.refreshAfterDate = new Date(Date.now() + (1000 * 60 * 30));

    list.addSpacer(6);
    const dateFormatter = new DateFormatter();
    dateFormatter.useShortDateStyle();
    dateFormatter.useShortTimeStyle();

    const updated = list.addText(`↻ ${dateFormatter.string(new Date(data.overall.updated))}`);
    updated.font = Font.lightSystemFont(9);
    updated.textColor = Color.lightGray();
  } else {
    list.addSpacer();
    list.addText("Daten nicht verfügbar");
  }

  return list;
}

async function getData() {
  try {
    let foundData;
    
    if (args.widgetParameter) {
      foundData = await new Request(getApiUrl(null, args.widgetParameter)).loadJSON();
    } else {
      const location = await getLocation();
      foundData = await new Request(getApiUrl(location)).loadJSON();
    }

    return foundData;
  } catch (e) {
    return null;
  }
}

async function getLocation() {
  try {
    Location.setAccuracyToThreeKilometers();
    return await Location.current();
  } catch (e) {
    return null;
  }
}
