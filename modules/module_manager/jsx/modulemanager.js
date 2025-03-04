import {createRoot} from 'react-dom/client';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Loader from 'Loader';
import FilterableDataTable from 'FilterableDataTable';
import swal from 'sweetalert2';

/**
 * Module Manager React Component
 */
class ModuleManagerIndex extends Component {
  /**
   * @constructor
   * @param {object} props - React Component properties
   */
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      error: false,
      isLoaded: false,
    };

    this.fetchData = this.fetchData.bind(this);

    this.formatColumn = this.formatColumn.bind(this);
    this.mapColumn = this.mapColumn.bind(this);

    this.toggleActive = this.toggleActive.bind(this);
    this.setModuleDisplayStatus = this.setModuleDisplayStatus.bind(this);
  }

  /**
   * Called by React when the component has been rendered on the page.
   */
  componentDidMount() {
    this.fetchData()
      .then(() => this.setState({isLoaded: true}));
  }

  /**
   * Retrieve data from the provided URL and save it in state
   *
   * @return {object}
   */
  fetchData() {
    return fetch(this.props.dataURL, {credentials: 'same-origin'})
      .then((resp) => resp.json())
      .then((data) => this.setState({data}))
      .catch((error) => {
        this.setState({error: true});
        console.error(error);
      });
  }

  /**
   * Modify value of specified column cells in the Data Table component
   *
   * @param {string} column - column name
   * @param {string} cell - cell value
   * @return {string} a mapped value for the table cell at a given column
   */
  mapColumn(column, cell) {
    switch (column) {
      case 'Active':
        if (cell === 'Y') {
          return 'Yes';
        } else if (cell === 'N') {
          return 'No';
        }
        // This shouldn't happen, it's a non-nullable
        // enum in the backend.
        return '?';
      default: return cell;
    }
  }

  /**
   * Toggle active
   *
   * @param {string} name
   * @param {boolean} value
   * @param {number} id
   */
  toggleActive(name, value, id) {
    fetch(
      this.props.BaseURL + '/module_manager/modules/' + name,
      {
        method: 'PATCH',
        body: JSON.stringify({
          'Active': value,
        }),
        mode: 'same-origin',
        credentials: 'same-origin',
        cache: 'no-cache',
      }
    ).then((response) => {
      if (response.status != 205) {
        swal.fire('Error!', 'Could not update ' + name + '.', 'error');
      } else {
        const success = this.setModuleDisplayStatus(name, value);
        if (success === true) {
          swal.fire({
            title: 'Success!',
            text: 'Updated ' + name + ' status! ' +
                  'To apply changes the interface must be reloaded. Proceed?',
            type: 'success',
            showCancelButton: true,
            confirmButtonText: 'Reload the page',
            cancelButtonText: 'Continue',
          }).then((status) => {
            if (status.value) {
              window.location.href = this.props.BaseURL
                                     + '/module_manager';
            }
          });
        } else {
          // If we get here something went very wrong, because somehow
          // a module was toggled that isn't in the table.
          swal.fire(
            'Error!',
            'Could not find module ' + id + '.',
            'error'
          );
        }
      }
    });
  }

  /**
   * Set Module Display Status
   *
   * @param {string} modulename
   * @param {boolean} value
   * @return {boolean}
   */
  setModuleDisplayStatus(modulename, value) {
    let data = this.state.data;
    for (let i = 0; i < data.Data.length; i++) {
      let row = data.Data[i];
      if (row[0] == modulename) {
        // Module names are unique, so there's
        // no reason to keep going once we update one.
        row[2] = value;
        this.setState({data});
        return true;
      }
    }
    return false;
  }

  /**
   * Modify behaviour of specified column cells in the Data Table component
   *
   * @param {string} column - column name
   * @param {string} cell - cell content
   * @param {object} row - row content indexed by column
   * @return {*} a formated table cell for a given column
   */
  formatColumn(column, cell, row) {
    if (column == 'Active' && this.props.hasEditPermission) {
        return <td><SelectElement
              name={row.Name}
              id={row.Name}
              label=''
              emptyOption={false}
              options={{'Y': 'Yes', 'N': 'No'}}
              value={cell}
              onUserInput={this.toggleActive}
              noMargins={true}
            /></td>;
    }
    cell = this.mapColumn(column, cell);
    return <td>{cell}</td>;
  }

  /**
   * Renders the React component.
   *
   * @return {JSX} - React markup for the component
   */
  render() {
    // If error occurs, return a message.
    // XXX: Replace this with a UI component for 500 errors.
    if (this.state.error) {
      return <h3>An error occured while loading the page.</h3>;
    }

    // Waiting for async data to load
    if (!this.state.isLoaded) {
      return <Loader/>;
    }

    const fields = [
      {label: 'Name', show: true, filter: {
        name: 'Name',
        type: 'text',
      }},
      {label: 'Full Name', show: true, filter: {
        name: 'Full Name',
        type: 'text',
      }},
      {label: 'Active', show: true, filter: {
        name: 'Active',
        type: 'select',
        options: {
            'Y': 'Yes',
            'N': 'No',
        },
      }},
    ];
    return (
      <FilterableDataTable
        name="module_manager"
        data={this.state.data.Data}
        fields={fields}
        getFormattedCell={this.formatColumn}
      />
    );
  }
}

ModuleManagerIndex.propTypes = {
  dataURL: PropTypes.string.isRequired,
  BaseURL: PropTypes.string,
  hasEditPermission: PropTypes.bool,
};

window.addEventListener('load', () => {
  const root = createRoot(document.getElementById('lorisworkspace'));
  root.render(
    <ModuleManagerIndex
      dataURL={`${loris.BaseURL}/module_manager/?format=json`}
      BaseURL={loris.BaseURL}
      hasEditPermission={loris.userHasPermission('module_manager_edit')}
    />
  );
});
