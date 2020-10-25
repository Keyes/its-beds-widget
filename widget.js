/* Licence: juliankern.com; CC BY 3.0 DE */
const apiUrlBase = 'http://intensiv-widget.juliankern.com/beds';
const getApiUrl = (location, state) => {
  if (location) { return `${apiUrlBase}?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}`; }
  if (state) { return `${apiUrlBase}?state=${state}`; }
  return apiUrlBase;
}

init();

async function init() {
  const widget = await createWidget();
  if (!config.runsInWidget) {
    await widget.presentSmall();
  }

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
      const label = list.addText(data.state.used.toFixed(2) + "%");
      label.font = Font.mediumSystemFont(22);
      label.textColor = data.state.used <= 25 ? Color.red() : data.state.used <= 50 ? Color.orange() : Color.green();

      const location = list.addText(data.state.name);
      location.font = Font.lightSystemFont(12);
      list.addSpacer(4);
    }

    const label = list.addText(data.overall.used.toFixed(2) + "%");
    label.font = Font.mediumSystemFont(22);
    label.textColor = data.overall.used <= 25 ? Color.red() : data.overall.used <= 50 ? Color.orange() : Color.green();
    const location = list.addText('Deutschland');
    location.font = Font.lightSystemFont(12);
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
