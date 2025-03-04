/**
 *  The following file contains the base component for the data query react app.
 *  It also contains the component for the saved queries dropdown.
 *
 *  @author   Jordan Stirling <jstirling91@gmail.com>
 *  @author   Dave MacFarlane <david.macfarlane2@mcgill.ca>
 *  @author   Alizée Wickenheiser <alizee.wickenheiser@mcgill.ca>
 *  @license  GPL-3.0-or-later
 *  @see {@link https://github.com/aces/Loris"|Loris}
 */
import {createRoot} from 'react-dom/client';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {NavigationStepper, NavigationWithSave} from './react.navigationStepper';
import {StepperPanel, ProgressBar} from './components/stepper';
import SavedQueriesList from './react.savedqueries';
import ExpansionPanels from './components/expansionpanels';
import NoticeMessage from './react.notice';
import {getSessions} from '../js/arrayintersect';

/**
 * DataQueryApp component
 *
 * The following component is the data queries base element. It controls which tab is currently
 * shown, along with keeping the state of the current query being built and running the query.
 *
 */
class DataQueryApp extends Component {
  /**
   * @constructor
   * @param {object} props - React Component properties
   */
  constructor(props) {
    super(props);
    this.state = {
      displayType: 'Cross-sectional',
      fields: [],
      criteria: {},
      sessiondata: {},
      grouplevel: 1,
      queryIDs: {
        user: [],
        shared: [],
        author: [],
      },
      savedQueries: {},
      queriesLoaded: false,
      alertLoaded: false,
      alertSaved: false,
      alertConflict: {
        show: false,
      },
      ActiveTab: 'Info',
      rowData: {},
      filter: {
        type: 'group',
        activeOperator: 0,
        children: [
          {
            type: 'rule',
          },
        ],
        session: [],
      },
      allSessions: [], // persistent "all sessions" after initial load.
      selectedFields: {},
      downloadableFields: {},
      loading: false,
      progressbar: {
        hidden: false,
        percentage: 0,
        message: 'LORIS is retrieving data...',
      },
      savePrompt: false,
      dataRequestPrompt: false,
      navigation: {
        disable: {
          previous: true,
          save: false,
          next: false,
        },
        index: 0,
      },
      // preload
      categories: [],
      UpdatedTime: 'Fetching when data was last updated information...',
      SavedQueries: {
        User: [],
        Shared: [],
      },
      Visits: [],
    };
    this.saveFilterRule = this.saveFilterRule.bind(this);
    this.saveFilterGroup = this.saveFilterGroup.bind(this);
    this.saveCurrentQuery = this.saveCurrentQuery.bind(this);
    this.overrideQuery = this.overrideQuery.bind(this);
    this.loadFilterRule = this.loadFilterRule.bind(this);
    this.loadFilterGroup = this.loadFilterGroup.bind(this);
    this.loadSavedQuery = this.loadSavedQuery.bind(this);
    this.fieldVisitSelect = this.fieldVisitSelect.bind(this);
    this.fieldChange = this.fieldChange.bind(this);
    this.getSessions = this.getSessions.bind(this);
    this.runQuery = this.runQuery.bind(this);
    this.getRowData = this.getRowData.bind(this);
    this.dismissAlert = this.dismissAlert.bind(this);
    this.resetQuery = this.resetQuery.bind(this);
    this.changeDataDisplay = this.changeDataDisplay.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.stepperClicked = this.stepperClicked.bind(this);
    this.navigationClicked = this.navigationClicked.bind(this);
    this.getSideBarVisibleStatus = this.getSideBarVisibleStatus.bind(this);
    this.displayVisualizedData = this.displayVisualizedData.bind(this);
    this.loadImportedCSV = this.loadImportedCSV.bind(this);
    this.getAllSessions = this.getAllSessions.bind(this);
    this.loadSavedQueries = this.loadSavedQueries.bind(this);
    this.handleProgressBarSetup = this.handleProgressBarSetup.bind(this);
    this.requestSessions = this.requestSessions.bind(this);
  }

  /**
   * display visualized data.
   */
  displayVisualizedData() {
    const state = Object.assign({}, this.state);
    state.ActiveTab = 'Statistics';
    state.navigation.index = 4;
    this.setState(state);
  }

  /**
   * Load Saved Queries
   */
  loadSavedQueries() {
    // Load the save queries' details
    let promises = [];
    for (let key in this.state.queryIDs) {
      if (this.state.queryIDs.hasOwnProperty(key)) {
        for (let i = 0; i < this.state.queryIDs[key].length; i += 1) {
          let curRequest;
          curRequest = Promise.resolve(
            $.ajax(loris.BaseURL
              + '/AjaxHelper.php?Module=dqt&script=GetDoc.php&DocID='
              + encodeURIComponent(this.state.queryIDs[key][i])), {
              data: {
                DocID: this.state.queryIDs[key][i],
              },
              dataType: 'json',
            }).then((value) => {
              let queries = this.state.savedQueries;
              queries[value._id] = value;
              this.setState({savedQueries: queries});
          });
          promises.push(curRequest);
        }
      }
    }
    Promise.all(promises).then((value) => {
      this.setState({'queriesLoaded': true});
    });
  }

  /**
   * Handle ProgressBar Setup
   *
   * @param {function} callback
   */
  async handleProgressBarSetup(callback) {
    const response = await fetch(
      `${loris.BaseURL}/dqt/dqt_setup/?format=json`,
      {credentials: 'same-origin', method: 'GET'}
    );
    const reader = await response.body.getReader();
    const contentLength = await response.headers.get('Content-Length');
    let receivedLength = 0; // received that many bytes at the moment
    let chunks = ''; // array of received binary chunks (comprises the body)
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        // finished reading chunks from stream reader.
        this.setState((prevState) => {
          return {
            ...prevState,
            progressbar: {
              message: 'Data Query Tool is configuring data!',
              hidden: prevState.progressbar.hidden,
              percentage: 100,
            },
          };
        });
        reader.closed.then(() => {
          let data;
          try {
            data = JSON.parse(chunks);
          } catch (exception) {
            return callback(false);
          }
          let categories = [];
          for (const [key, value] of Object.entries(data.categories)) {
            categories.push({
              category: key,
              numFields: value,
            });
          }
          data.categories = categories;
          setTimeout(async () => {
            await this.setState((prevState) => {
              return {
                ...prevState,
                progressbar: {
                  message: prevState.progressbar.message,
                  hidden: true,
                  percentage: prevState.progressbar.percentage,
                },
                queryIDs: data.savedqueries,
                categories: data.categories,
                UpdatedTime: `Data was last updated on ${data.updatetime}`,
                SavedQueries: data.savedqueries,
                Visits: data.visits,
              };
            }, () => {
              return callback(true);
            });
          }, 1200); // wait 1.2 seconds
        }).catch((error) => {
          if (error) {
            return callback(false);
          }
        });
        break;
      } else {
        // Continue reading chunks from stream reader.
        const decode = new TextDecoder('utf-8').decode(value);
        chunks += decode;
        receivedLength += value.length;
        this.setState((prevState) => {
          return {
            ...prevState,
            progressbar: {
              hidden: prevState.progressbar.hidden,
              percentage: Math.round((receivedLength / contentLength) * 100),
              message: prevState.progressbar.message,
            },
          };
        });
      }
    }
  }

  /**
   * getSessions - takes awhile if large couchdb instance.
   *
   * @param {function} callback
   */
  async requestSessions(callback) {
    const response = await fetch(
      `${loris.BaseURL}/dqt/sessions/?format=json`,
      {credentials: 'same-origin', method: 'GET'}
    );
    const reader = await response.body.getReader();
    let chunks = ''; // array of received binary chunks (comprises the body)
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        // finished reading chunks from stream reader.
        reader.closed.then(async () => {
          let data;
          try {
            data = JSON.parse(chunks);
          } catch (exception) {
            return callback(false);
          }
          await this.setState((prevState) => {
            return {
              ...prevState,
              filter: {
                ...prevState.filter,
                session: data.sessions,
              },
              allSessions: data.sessions,
            };
          }, () => {
            return callback(true);
          });
        }).catch((error) => {
          if (error) {
            return callback(false);
          }
        });
        break;
      } else {
        // Continue reading chunks from stream reader.
        const decode = new TextDecoder('utf-8').decode(value);
        chunks += decode;
      }
    }
  }

  /**
   * Called by React when the component has been rendered on the page.
   */
  async componentDidMount() {
    // dqtWorker = new Worker(`${loris.BaseURL}/dqt/js/workers/dqt.worker.js`);
    // dqtWorker.onmessage = (event) => {
    //   if (event && event.data) {
    //     console.log('event is ');
    //     console.log(event);
    //   }
    // };
    // dqtWorker.postMessage({msg: 'setupCouchDB'});
    // dqtWorker.postMessage({msg: 'test', lastUpdate: 'todo'});
    // Handle Progress Bar Setup
    this.handleProgressBarSetup((success) => {
      if (success) {
        this.loadSavedQueries();
        this.requestSessions((success) => {
          if (success) {} else {
            console.error('requestSessions failed');
          }
        });
      } else {
        console.error('handleProgressBarSetup failed');
      }
    });
  }

  /**
   * save filter rule
   *
   * @param {object} rule - sets the filter rule
   * @return {object}
   */
  saveFilterRule(rule) {
    // Used to build a filter rule for saving query
    return {
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      instrument: rule.instrument,
      visit: rule.visit,
    };
  }

  /**
   * save filter group
   *
   * @param {object} group - sets the filter group for saving query.
   * @return {object}
   */
  saveFilterGroup(group) {
    // Used to build a filter group for saving query

    let savedFilter = {
      activeOperator: group.activeOperator,
      children: [],
    };
    // Recursively build the filter groups children
    for (let i = 0; i < group.children.length; i++) {
      if (group.children[i].type === 'rule') {
        savedFilter.children.push(this.saveFilterRule(group.children[i]));
      } else if (group.children[i].type === 'group') {
        savedFilter.children.push(this.saveFilterGroup(group.children[i]));
      }
    }
    return savedFilter;
  }

  /**
   * save current query
   *
   * @param {string} name
   * @param {string} shared
   * @param {boolean} override
   */
  saveCurrentQuery(name, shared, override) {
    // Used to save the current query

    let filter = this.saveFilterGroup(this.state.filter);
    const fields = JSON.stringify(this.state.selectedFields);

    $.post(loris.BaseURL
      + '/AjaxHelper.php?Module=dqt&script=saveQuery.php', {
      Fields: fields,
      Filters: filter,
      QueryName: name,
      SharedQuery: shared,
      OverwriteQuery: override,
    }, (data) => {
      // Once saved, add the query to the list of saved queries
      const id = JSON.parse(data).id;
      const queryIDs = this.state.queryIDs;
      if (!override) {
        if (shared === true) {
          queryIDs.Shared.push(id);
        } else {
          queryIDs.User.push(id);
        }
      }
      $.get(loris.BaseURL
        + '/AjaxHelper.php?Module=dqt&script=GetDoc.php&DocID='
        + id,
        (value) => {
          let queries = this.state.savedQueries;

          queries[value._id] = value;
          this.setState({
            savedQueries: queries,
            queryIDs: queryIDs,
            alertLoaded: false,
            alertSaved: true,
            alertConflict: {
              show: false,
            },
          });
        });
    }).fail((data) => {
      if (data.status === 409) {
        this.setState({
          alertConflict: {
            show: true,
            QueryName: name,
            SharedQuery: shared,
          },
        });
      }
    });
  }

  /**
   * override query
   */
  overrideQuery() {
    this.saveCurrentQuery(
      this.state.alertConflict.QueryName,
      this.state.alertConflict.SharedQuery,
      true
    );
  }

  /**
   * Used to load in a filter rule
   *
   * @param {object} rule
   * @return {object} rule
   */
  loadFilterRule(rule) {
    // Used to load in a filter rule

    let script;
    if (!rule.type) {
      rule.type = 'rule';
    }

    // Get given fields of the instrument for the rule.
    // This call is made synchronously
    $.ajax({
      url: loris.BaseURL
        + '/AjaxHelper.php?Module=dqt&script=datadictionary.php',
      success: (data) => {
        rule.fields = data;
      },
      async: false,
      data: {category: rule.instrument},
      dataType: 'json',
    });

    // Find the rules selected field's data type
    for (let i = 0; i < rule.fields.length; i++) {
      if (rule.fields[i].key[1] === rule.field) {
        rule.fieldType = rule.fields[i].value.Type;
        break;
      }
    }

    // Get the sessions which meet the rules criterias.
    // TODO:    Build the sessions in the new format
    switch (rule.operator) {
      case 'equal':
      case 'isNull':
        script = 'queryEqual.php';
        break;
      case 'notEqual':
      case 'isNotNull':
        script = 'queryNotEqual.php';
        break;
      case 'lessThanEqual':
        script = 'queryLessThanEqual.php';
        break;
      case 'greaterThanEqual':
        script = 'queryGreaterThanEqual.php';
        break;
      case 'startsWith':
        script = 'queryStartsWith.php';
        break;
      case 'contains':
        script = 'queryContains.php';
        break;
      default:
        break;
    }
    $.ajax({
      url: loris.BaseURL + '/AjaxHelper.php?Module=dqt&script=' + script,
      success: (data) => {
        let i;
        let allSessions = {};
        let allCandiates = {};
        // Loop through data and divide into individual visits with unique PSCIDs
        // storing a master list of unique PSCIDs
        for (i = 0; i < data.length; i++) {
          if (!allSessions[data[i][1]]) {
            allSessions[data[i][1]] = [];
          }
          allSessions[data[i][1]].push(data[i][0]);
          if (!allCandiates[data[i][0]]) {
            allCandiates[data[i][0]] = [];
          }
          allCandiates[data[i][0]].push(data[i][1]);
        }
        rule.candidates = {
          allCandiates: allCandiates,
          allSessions: allSessions,
        };
        if (rule.visit === 'All') {
          rule.session = Object.keys(allCandiates);
        } else {
          if (allSessions[rule.visit]) {
            rule.session = allSessions[rule.visit];
          } else {
            rule.session = [];
          }
        }
      },
      async: false,
      data: {
        category: rule.instrument,
        field: rule.field,
        value: rule.value,
      },
      dataType: 'json',
    });

    return rule;
  }

  /**
   * Used to load in a filter group
   *
   * @param {object} group
   * @return {object} group
   */
  loadFilterGroup(group) {
    // Used to load in a filter group

    // Recursively load the children on the group
    for (let i = 0; i < group.children.length; i++) {
      if (group.children[i].activeOperator) {
        if (!group.children[i].type) {
          group.children[i].type = 'group';
        }
        group.children[i] = this.loadFilterGroup(group.children[i]);
      } else {
        group.children[i] = this.loadFilterRule(group.children[i]);
      }
    }
    group.session = getSessions(group);
    return group;
  }

  /**
   * Load the imported CSV from the user.
   *
   * @param {array} filter
   */
  loadImportedCSV(filter) {
    filter.importCSV = true;
    this.setState({
      fields: this.state.fields ?? [],
      selectedFields: this.state.selectedFields ?? {},
      filter: filter,
      alertLoaded: false,
      alertSaved: false,
      loading: false,
    });
  }

  /**
   * Used to load a saved query
   * Query can be saved in 2 formats:
   * params can be arrays or objects
   *
   * @param {string[]|object} fields
   * @param {object[]|object} criteria
   */
  loadSavedQuery(fields, criteria) {
    let filterState = {};
    let selectedFields = {};
    let fieldsList = [];
    this.setState({loading: true});
    if (Array.isArray(criteria)) {
      // This is used to load a query that is saved in the old format
      // so translate it into the new format, grouping the given critiras
      // into a filter group

      filterState = {
        type: 'group',
        activeOperator: 0,
        children: [],
      };
      filterState.children = criteria.map((item) => {
        let fieldInfo = item.Field.split(',');
        let rule = {
          instrument: fieldInfo[0],
          field: fieldInfo[1],
          value: item.Value,
          type: 'rule',
          visit: 'All',
        };
        switch (item.Operator) {
          case '=':
            rule.operator = 'equal';
            break;
          case '!=':
            rule.operator = 'notEqual';
            break;
          case '<=':
            rule.operator = 'lessThanEqual';
            break;
          case '>=':
            rule.operator = 'greaterThanEqual';
            break;
          default:
            rule.operator = item.Operator;
            break;
        }
        return rule;
      });

      let fieldSplit;
      fieldsList = fields;
      for (let i = 0; i < fields.length; i++) {
        fieldSplit = fields[i].split(',');
        if (!selectedFields[fieldSplit[0]]) {
          selectedFields[fieldSplit[0]] = {};
          selectedFields[fieldSplit[0]][fieldSplit[1]] = {};
          selectedFields[fieldSplit[0]].allVisits = {};
          for (let key in this.state.Visits) {
            if (this.state.Visits.hasOwnProperty(key)) {
              selectedFields[fieldSplit[0]].allVisits[key] = 1;
              selectedFields[fieldSplit[0]][fieldSplit[1]][key] = [key];
            }
          }
        } else {
          selectedFields[fieldSplit[0]][fieldSplit[1]] = {};
          for (let key in this.state.Visits) {
            if (this.state.Visits.hasOwnProperty(key)) {
              selectedFields[fieldSplit[0]].allVisits[key]++;
              selectedFields[fieldSplit[0]][fieldSplit[1]][key] = [key];
            }
          }
        }
      }
    } else {
      // Query was saved in the new format
      filterState = criteria;
      selectedFields = fields ? fields : {};
      for (let instrument in fields) {
        if (fields.hasOwnProperty(instrument)) {
          for (let field in fields[instrument]) {
            if (field !== 'allVisits') {
              fieldsList.push(instrument + ',' + field);
            }
          }
        }
      }
    }
    if (filterState.children && filterState.children.length > 0) {
      filterState = this.loadFilterGroup(filterState);
    } else {
      filterState.children = [
        {
          type: 'rule',
        },
      ];
      filterState.session = this.state.filter.session;
    }
    this.setState({
      fields: fieldsList,
      selectedFields: selectedFields,
      filter: filterState,
      alertLoaded: true,
      alertSaved: false,
      loading: false,
    });
    $.ajax({
      url: loris.BaseURL + '/dqt/ajax/datadictionary.php',
      success: (data) => {
        for (let i = 0; i < fieldsList.length; i++) {
          if (data[i] && data[i].value.IsFile) {
            let key = data[i].key[0] + ',' + data[i].key[1];
            let downloadable = this.state.downloadableFields;
            downloadable[key] = true;
            this.setState({
              downloadableFields: downloadable,
            });
          }
        }
      },
      data: {keys: JSON.stringify(fieldsList)},
      dataType: 'json',
    });
  }

  /**
   * Used to select visits for a given field
   *
   * @param {string} action
   * @param {string} visit
   * @param {object} field
   */
  fieldVisitSelect(action, visit, field) {
    // Used to select visits for a given field
    this.setState((state) => {
      let temp = state.selectedFields[field.instrument];
      if (action === 'check') {
        // Adding a new visit for field, add visit to field and
        // increase count of visit in allVisits
        temp[field.field][visit] = visit;
        if (temp.allVisits[visit]) {
          temp.allVisits[visit]++;
        } else {
          temp.allVisits[visit] = 1;
        }
      } else {
        // Removing visit, delete visit from field
        delete temp[field.field][visit];
        // delete visit from allVisits
        delete temp.allVisits[visit];
      }
      return temp;
    });
  }

  /**
   * Used to add and remove fields from the current query being built
   *
   * @param {object} fieldName
   * @param {object} category
   * @param {object} downloadable
   */
  fieldChange(fieldName, category, downloadable) {
    // Used to add and remove fields from the current query being built
    this.setState((state) => {
      let selectedFields = state.selectedFields;
      let fields = state.fields.slice(0);
      if (!selectedFields[category]) {
        // The given category has no selected fields, add the category to the selectedFields
        selectedFields[category] = {};
        // Add all visits to the given field for the given category
        let first = Object.keys(this.state.Visits)[0];
        selectedFields[category][fieldName] = JSON.parse(JSON.stringify({
          [first]: first,
        }));
        // Add all visits to the given category, initializing their counts to 1
        selectedFields[category].allVisits = {};
        for (let key in this.state.Visits) {
          if (this.state.Visits.hasOwnProperty(key)) {
            selectedFields[category].allVisits[key] = 1;
            break;
          }
        }

        // Add field to the field list
        fields.push(category + ',' + fieldName);

        if (downloadable) {
          // If the field is downloadable add to the list of downloadable fields
          state.downloadableFields[category + ',' + fieldName] = true;
        }
      } else if (selectedFields[category][fieldName]) {
        // Remove the field from the selectedFields
        for (let key in selectedFields[category][fieldName]) {
          if (selectedFields[category][fieldName].hasOwnProperty(key)) {
            // Decrement the count of field's visits, delete visit if count is 1
            if (selectedFields[category].allVisits[key] === 1) {
              delete selectedFields[category].allVisits[key];
            } else {
              selectedFields[category].allVisits[key]--;
            }
          }
        }
        delete selectedFields[category][fieldName];

        // Find the given field in the fields list and remove it
        let idx = fields.indexOf(category + ',' + fieldName);
        fields.splice(idx, 1);

        if (Object.keys(selectedFields[category]).length === 1) {
          // If no more fields left for category, delete category from
          // selectedFields
          delete selectedFields[category];
        }

        if (downloadable) {
          // If the field was downloadable, delete it from the downloadable list
          delete state.downloadableFields[category + ',' + fieldName];
        }
      } else {
        // The category already has fields but not the desired one, add it
        if (!selectedFields[category][fieldName]) {
          selectedFields[category][fieldName] = {};
        }

        // Increment the visit count for the visit, setting it to 1 if doesn't exist
        for (let key in selectedFields[category].allVisits) {
          if (key === 'allVisits') {
            continue;
          }
          if (selectedFields[category].allVisits.hasOwnProperty(key)) {
            selectedFields[category].allVisits[key]++;
            selectedFields[category][fieldName][key] = key;
          }
        }
        fields.push(category + ',' + fieldName);
        if (downloadable) {
          // If the field is downloadable add to the list of downloadable fields
          state.downloadableFields[category + ',' + fieldName] = true;
        }
      }
      return {
        selectedFields: selectedFields,
        fields: fields,
      };
    });
  }

  /**
   * Get the sessions to be selected
   *
   * @return {Array|void}
   */
  getSessions() {
    if (this.state.filter.children.length > 0) {
      // If filter exists return filter sessions
      return this.state.filter.session;
    }
  }

  /**
   * Run the current query
   *
   * @param {string[]} fields
   */
  runQuery(fields) {
    let DocTypes = [];
    let semaphore = 0;
    let sectionedSessions;
    let ajaxComplete = () => {
        // Wait until all ajax calls have completed before computing the rowdata
        if (semaphore == 0) {
          let rowdata = this.getRowData(this.state.grouplevel);
          this.setState({
            rowData: rowdata,
            loading: false,
          });
        }
      };

    // Reset the rowData and sessiondata
    this.setState({
      rowData: {},
      sessiondata: {},
      loading: true,
    });

    // Get list of DocTypes to be retrieved
    for (let i = 0; i < fields.length; i += 1) {
      let fieldSplit = fields[i].split(',');
      let category = fieldSplit[0];

      // Check if the current category has already been queried, if so skip
      if (DocTypes.indexOf(category) === -1) {
        let sessionInfo = [];

        // Build the session data to be queried for the given category
        for (let j = 0; j < this.state.filter.session.length; j++) {
          if (Array.isArray(this.state.filter.session[j])) {
            if (this.state.selectedFields[category].allVisits[
              this.state.filter.session[j][1]
              ]) {
              sessionInfo.push(this.state.filter.session[j]);
            }
          } else {
            for (let key in this.state.selectedFields[category].allVisits) {
              if (this.state.selectedFields[
                category
                ].allVisits.hasOwnProperty(key)) {
                let temp = [];

                temp.push(this.state.filter.session[j]);
                // Add the visit to the temp variable then add to the sessions to be queried
                temp.push(key);
                sessionInfo.push(temp);
              }
            }
          }
        }

        DocTypes.push(category);
        // keep track of the number of requests waiting for a response
        semaphore++;
        sectionedSessions = JSON.stringify(sessionInfo);
        $.ajax({
          type: 'POST',
          url: loris.BaseURL
            + '/AjaxHelper.php?Module=dqt&script='
            + 'retrieveCategoryDocs.php',
          data: {
            DocType: category,
            Sessions: sectionedSessions,
          },
          dataType: 'text',
          success: (data) => {
            if (data) {
              let i;
              let row;
              let rows;
              let identifier;
              let sessiondata = this.state.sessiondata;
              data = JSON.parse(data);
              rows = data.rows;
              for (i = 0; i < rows.length; i += 1) {
                /*
                 * each row is a JSON object of the
                 * form:
                 * {
                 *  "key" : [category, pscid, vl],
                 *  "value" : [pscid, vl],
                 *  "doc": {
                 *      Meta: { stuff }
                 *      data: { "FieldName" : "Value", .. }
                 * }
                 */
                row = rows[i];
                identifier = row.value;
                if (!sessiondata.hasOwnProperty(identifier)) {
                  sessiondata[identifier] = {};
                }
                sessiondata[identifier][row.key[0]] = row.doc;
              }
              this.setState({'sessiondata': sessiondata});
            }
            semaphore--;
            ajaxComplete();
          },
        });
      }
    }
  }

  /**
   * Build the queried data to be displayed in the data table
   *
   * @param {number} displayID
   * @return {object}
   */
  getRowData(displayID) {
    let sessiondata = this.state.sessiondata;
    let fields = this.state.fields.sort();
    let downloadableFields = this.state.downloadableFields;
    let i;
    let rowdata = [];
    let currow = [];
    let Identifiers = [];
    let RowHeaders = [];
    let fileData = [];
    let href;

    if (displayID === 0) {
      // Displaying the data in the cross-sectional way

      // Add the fields as the tables headers
      for (i = 0; fields && i < fields.length; i += 1) {
        RowHeaders.push(fields[i]);
      }

      // Build the table rows, using the session data as the row identifier
      for (let session in sessiondata) {
        if (sessiondata.hasOwnProperty(session)) {
          currow = [];
          for (i = 0; fields && i < fields.length; i += 1) {
            let fieldSplit = fields[i].split(',');
            currow[i] = '.';
            let sd = sessiondata[session];
            if (sd[fieldSplit[0]]
              && sd[fieldSplit[0]].data[fieldSplit[1]]
              && downloadableFields[fields[i]]) {
              // If the current field has data and is downloadable, create a download link
              href = loris.BaseURL
                + '/mri/jiv/get_file.php?file='
                + sd[fieldSplit[0]].data[fieldSplit[1]];
              currow[i] = (
                <a href={href}>
                  {sd[fieldSplit[0]].data[fieldSplit[1]]}
                </a>
              );
              fileData.push('file/'
                + sd[fieldSplit[0]]._id
                + '/'
                + encodeURIComponent(sd[fieldSplit[0]].data[fieldSplit[1]])
              );
            } else if (sd[fieldSplit[0]]) {
              // else if field is not null add data and string
              currow[i] = sd[fieldSplit[0]].data[fieldSplit[1]];
            }
          }
          rowdata.push(currow);
          Identifiers.push(session);
        }
      }
    } else {
      // Displaying the data in the longitudinal way

      let Visits = {};
      let visit;
      let identifier;
      let temp;
      let colHeader;
      let index;
      let instrument;
      let fieldSplit;

      // Loop trough session data building the row identifiers and desired visits
      for (let session in sessiondata) {
        if (sessiondata.hasOwnProperty(session)) {
          temp = session.split(',');
          visit = temp[1];
          if (!Visits[visit]) {
            Visits[visit] = true;
          }
          identifier = temp[0];
          if (Identifiers.indexOf(identifier) === -1) {
            Identifiers.push(identifier);
          }
        }
      }

      // Loop through the desired fields, adding a row header for each visit if it
      // has been selected in the build phase
      for (i = 0; fields && i < fields.length; i += 1) {
        for (visit in Visits) {
          if (Visits.hasOwnProperty(visit)) {
            temp = fields[i].split(',');
            instrument = this.state.selectedFields[temp[0]];
            if (instrument
              && instrument[temp[1]]
              && instrument[temp[1]][visit]
            ) {
              RowHeaders.push(visit + ' ' + fields[i]);
            }
          }
        }
      }

      // Build the row data for the giving identifiers and headers
      for (identifier in Identifiers) {
        if (Identifiers.hasOwnProperty(identifier)) {
          currow = [];
          for (colHeader in RowHeaders) {
            if (RowHeaders.hasOwnProperty(colHeader)) {
              temp = Identifiers[identifier]
                + ','
                + RowHeaders[colHeader].substr(
                  0,
                  RowHeaders[colHeader].lastIndexOf(' ')
                );
              index = sessiondata[temp];
              if (!index) {
                currow.push('.');
              } else {
                const instrument = RowHeaders[colHeader].substr(
                  RowHeaders[colHeader].lastIndexOf(' ') + 1
                ).split(',')[0];
                temp = index[instrument];
                fieldSplit = RowHeaders[colHeader].substr(
                  RowHeaders[colHeader].lastIndexOf(' ') + 1
                ).split(',');
                if (temp) {
                  if (temp.data[RowHeaders[colHeader].split(',')[1]]
                    && downloadableFields[fieldSplit[0]
                    + ',' + fieldSplit[1]]) {
                    // Add a downloadable link if the field is set and downloadable
                    href = loris.BaseURL
                      + '/mri/jiv/get_file.php?file='
                      + temp.data[RowHeaders[colHeader].split(',')[1]];
                    fileData.push('file/'
                      + temp._id
                      + '/'
                      + encodeURIComponent(temp.data[fieldSplit[1]])
                    );
                    temp = (
                      <a href={href}>
                        {temp.data[RowHeaders[colHeader].split(',')[1]]}
                      </a>
                    );
                  } else {
                    temp = temp.data[RowHeaders[colHeader].split(',')[1]];
                  }
                } else {
                  temp = '.';
                }
                currow.push(temp);
              }
            }
          }
          rowdata.push(currow);
        }
      }
    }
    return {
      rowdata: rowdata,
      Identifiers: Identifiers,
      RowHeaders: RowHeaders,
      fileData: fileData,
    };
  }

  /**
   * Used to dismiss alerts
   */
  dismissAlert() {
    this.setState({
      alertLoaded: false,
      alertSaved: false,
      alertConflict: {
        show: false,
      },
    });
  }

  /**
   * Used to reset the current query
   */
  resetQuery() {
    this.setState({
      fields: [],
      criteria: {},
      selectedFields: {},
    });
  }

  /**
   * Change the display format of the data table
   *
   * @param {number} displayID
   */
  changeDataDisplay(displayID) {
    let rowdata = this.getRowData(displayID);
    this.setState({
      grouplevel: displayID,
      ...(rowdata.rowdata.length > 0
        ? {rowData: rowdata}
        : {rowData: {}}),
    });
  }

  /**
   * Update the filter
   *
   * @param {object} filter
   */
  updateFilter(filter) {
    if (filter.children.length === 0) {
      filter.session = this.state.allSessions;
    }
    this.setState({filter});
  }

  /**
   * navigation clicked
   *
   * @param {string} command
   */
  navigationClicked(command) {
    let state = Object.assign({}, this.state);
    let step = state.ActiveTab;
    const steps = [
      'Info',
      'DefineFields',
      'DefineFilters',
      'ViewData',
      'Statistics',
    ];
    let index = steps.indexOf(step);
    switch (command) {
      case 'previous':
        index--;
        step = steps[index];
        this.stepperClicked(step, index);
        break;
      case 'next':
        index++;
        step = steps[index];
        this.stepperClicked(step, index);
        break;
      case 'save':
        this.setState({savePrompt: true});
        break;
      default:
        break;
    }
  }

  /**
   * stepper clicked
   *
   * @param {string} step
   * @param {number} index
   */
  stepperClicked(step, index) {
    switch (step) {
      case 'Info':
        this.setState({
          activeTab: 'Info',
          navigation: {
          disable: {
            previous: true,
            save: false,
            next: false,
          },
          index: index,
        }});
        break;
      case 'ViewData':
        this.setState({
          activeTab: 'ViewData',
          navigation: {
            disable: {
              previous: false,
              save: false,
              next: true,
            },
            index: index,
        }});
        break;
      case 'Statistics':
        break;
      default:
        this.setState({navigation: {
            disable: {
              previous: false,
              save: false,
              next: false,
            },
            index: index,
          }});
        break;
    }
    this.setState({ActiveTab: step});
  }

  /**
   * get sidebar visible status
   *
   * @return {boolean}
   */
  getSideBarVisibleStatus() {
    return (this.state.fields.length > 0
      && this.state.ActiveTab !== 'ViewData'
      && this.state.ActiveTab !== 'Statistics'
      && this.state.ActiveTab !== 'Info');
  }

  /**
   * get AllSessions when needed.
   *
   * @return {array}
   */
  getAllSessions() {
    return this.props.AllSessions;
  }

  /**
   * Renders the React component.
   *
   * @return {JSX} - React markup for the component
   */
  render() {
    let tabs = [];

    // Create or Load tab.
    tabs.push(
      <StepperPanel
        key={'Info'}
        TabId='Info'
        active={this.state.ActiveTab === 'Info'}
        content={(
          <>
            <h1 style={{
              color: '#0a3572',
              textAlign: 'center',
              padding: '30px 0 0 0',
            }}>
              Welcome to the Data Query Tool
            </h1>
            <p style={{textAlign: 'center', margin: '10px 0 20px 0'}}>
              {this.state.UpdatedTime}.
            </p>
            <ExpansionPanels
              panels={[
                {
                  title: 'Instructions on how to create a query',
                  content: (
                    <>
                      <p>
                        To start a new query, use the above navigation
                        and or click on <i style={{color: '#596978'}}>
                        "Define Fields"</i>
                        &nbsp;to begin building the fields for the query.
                      </p>
                      <p>
                        You may choose to then click the navigation
                        again for the <i style={{color: '#596978'}}>
                        "Define Filters (Optional)"</i>
                        &nbsp;and define how you will filter the query data.
                      </p>
                      <p>Lastly, navigate to the <i style={{color: '#596978'}}>
                        "Run Query"</i> and run the query you built. 🙂</p><br/>
                    </>
                  ),
                  alwaysOpen: true,
                },
                {
                  title: 'Load Existing Query',
                  content: (
                    <>
                      <ManageSavedQueriesTabPane
                        key='SavedQueriesTab'
                        TabId='SavedQueriesTab'
                        userQueries={this.state.queryIDs.user}
                        globalQueries={this.state.queryIDs.shared}
                        onSaveQuery={this.saveCurrentQuery}
                        queryDetails={this.state.savedQueries}
                        onSelectQuery={this.loadSavedQuery}
                        queriesLoaded={this.state.queriesLoaded}
                        Loading={this.state.loading}
                        savePrompt={this.state.savePrompt}
                      />
                      <SavedQueriesList
                        userQueries={this.state.queryIDs.user}
                        globalQueries={this.state.queryIDs.shared}
                        author={this.state.queryIDs.author}
                        queryDetails={this.state.savedQueries}
                        queriesLoaded={this.state.queriesLoaded}
                        onSelectQuery={this.loadSavedQuery}
                        loadedQuery={this.state.loadedQuery}
                      />
                    </>
                  ),
                },
              ]}
            />
          </>
        )}
      />
    );
    // Define Fields tab.
    tabs.push(
      <StepperPanel
        key={'DefineFields'}
        TabId='DefineFields'
        active={this.state.ActiveTab === 'DefineFields'}
        content={(
          <FieldSelectTabPane
            key='DefineFields'
            TabId='DefineFields'
            categories={this.state.categories}
            onFieldChange={this.fieldChange}
            selectedFields={this.state.selectedFields}
            Visits={this.state.Visits}
            fieldVisitSelect={this.fieldVisitSelect}
            Loading={this.state.loading}
            Active={this.state.ActiveTab === 'DefineFields'}
          />
        )}
      />
    );
    // Define Filters (Optional) tab.
    tabs.push(
      <StepperPanel
        key={'DefineFilters'}
        TabId='DefineFilters'
        active={this.state.ActiveTab === 'DefineFilters'}
        content={(
          <FilterSelectTabPane
            key='DefineFilters'
            TabId='DefineFilters'
            categories={this.state.categories}
            filter={this.state.filter}
            updateFilter={this.updateFilter}
            Visits={this.state.Visits}
            Loading={this.state.loading}
            Active={this.state.ActiveTab === 'DefineFilters'}
            loadImportedCSV={this.loadImportedCSV}
            getAllSessions={this.getAllSessions}
          />
        )}
      />
    );

    // Define the data displayed type and add the view data tab
    let displayType = (this.state.grouplevel === 0)
      ? 'Cross-sectional'
      : 'Longitudinal';

    // Run Query tab.
    tabs.push(
      <StepperPanel
        key={'ViewData'}
        TabId='ViewData'
        active={this.state.ActiveTab === 'ViewData'}
        content={(
          <ViewDataTabPane
            key='ViewData'
            TabId='ViewData'
            Active={this.state.ActiveTab === 'ViewData'}
            Fields={this.state.fields}
            Criteria={this.state.criteria}
            AllSessions={this.state.filter.session}
            filter={this.state.filter}
            Sessions={this.getSessions()}
            Data={this.state.rowData.rowdata}
            RowInfo={this.state.rowData.Identifiers}
            RowHeaders={this.state.rowData.RowHeaders}
            FileData={this.state.rowData.fileData}
            onRunQueryClicked={this.runQuery}
            displayType={displayType}
            changeDataDisplay={this.changeDataDisplay}
            Loading={this.state.loading}
            runQuery={this.runQuery}
            displayVisualizedData={this.displayVisualizedData}
          />
        )}
      />
    );

    // Add the stats tab
    tabs.push(<StatsVisualizationTabPane
      key='Statistics'
      TabId='Statistics'
      Active={this.state.ActiveTab === 'Statistics'}
      Fields={this.state.rowData.RowHeaders}
      Data={this.state.rowData.rowdata}
      Loading={this.state.loading}
    />);

    let sideBar = this.getSideBarVisibleStatus()
      ? (
        <div className='col-md-3'>
          <FieldsSidebar
            Fields={this.state.fields}
            Criteria={this.state.criteria}
            resetQuery={this.resetQuery}
          />
        </div>
      )
      : null;

    let widthClass = this.getSideBarVisibleStatus()
      ? 'col-md-9'
      : 'col-md-12';

    let mySavePrompt = this.state.savePrompt ? (
      <SaveQueryDialog
        onDismissClicked={() => {
          this.setState({savePrompt: false});
        }}
        onSaveClicked={(name, shared) => {
          this.saveCurrentQuery(name, shared, 'false');
          this.setState({savePrompt: false});
        }}
      />
    ) : null;

    return (
      <>
        <ProgressBar
          message={this.state.progressbar.message}
          visible={!this.state.progressbar.hidden}
          percentage={this.state.progressbar.percentage}
        />
        <NavigationWithSave
          index={this.state.navigation.index}
          disable={this.state.navigation.disable}
          onClickHandler={this.navigationClicked}
          visible={this.state.progressbar.hidden}
        />
        <NavigationStepper
          setIndex={this.state.ActiveTab}
          stepperClicked={this.stepperClicked}
          visible={this.state.progressbar.hidden}
        />
        <NoticeMessage
          dismissAlert={this.dismissAlert}
          overrideQuery={this.overrideQuery}
          alertConflict={this.state.alertConflict}
          alertSaved={this.state.alertSaved}
          alertLoaded={this.state.alertLoaded}
        />
        {mySavePrompt}
        <div className={widthClass}>
          <div className='tab-content'>
            {tabs}
          </div>
        </div>
        {sideBar}
      </>
    );
  }
}

DataQueryApp.propTypes = {
  baseURL: PropTypes.string,
  title: PropTypes.string,
  SavedQueries: PropTypes.object,
  categories: PropTypes.array,
  Visits: PropTypes.array,
  UpdatedTime: PropTypes.string,
  AllSessions: PropTypes.array,
  Visits: PropTypes.array,
  UpdatedTime: PropTypes.string,
  categories: PropTypes.array,
};
DataQueryApp.defaultProps = {
  title: 'Fields',
  SavedQueries: {
    User: [],
    Shared: [],
  },
  categories: [],
  Visits: [],
  UpdatedTime: 'Fetching when data was last updated information...',
};

/**
 * Render DataQueryApp on page load.
 */
window.addEventListener('load', () => {
  const root = createRoot(document.getElementById('lorisworkspace'));
  root.render(
    <DataQueryApp
      baseURL={loris.BaseURL}
    />
  );
});
