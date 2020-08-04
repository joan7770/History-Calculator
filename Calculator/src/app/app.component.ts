import { Component } from '@angular/core';
import { parse } from 'mathjs';
import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'calculator';
  mathString: string;
  tableCols: string[] = ['expression', 'result'];
  historyData: Promise<{}[]> | null = null;
  private resolve: Function | null = null;

  constructor() {
    this.mathString = '';
    this.reset();
    this.refreshData();
  }

  clear() {
    this.mathString = '';
  }

  backspace() {
    this.mathString = this.mathString.slice(0, this.mathString.length-1);
  }

  appendMathString(charater) {
    this.mathString += charater;
  }

  async evaluateEquation() {
    try {
      // Math.js
      const parser = parse(this.mathString);
      const compile = parser.compile();
      const result = compile.evaluate();

      this.mathString = '' + result;
      await this.addToHistory(parse.toString(), result);
    } catch (error) {
      console.log(error.message);
    }
  }

  async addToHistory(exp, res) {
    // POST to AWS for updating MongoDB
    let data = {
      expression: exp,
      result: res
    }
    let hostname = window.location.hostname;
    let url = 'https://' + hostname + '/api';
    var jqxhr = await $.post(url, data, function () {
      console.log('Sending: ' + data);
    },"json").fail(function (jqxhr, textStatus, error) {
       console.log("Request Failed: " + textStatus + ", " + error);
    });

    this.reset();
    await this.refreshData();
  }

  reset() {
    this.historyData = new Promise<{}[]>((resolve, reject) => {
      this.resolve = resolve;
    });
  }

  async refreshData() {
    let history = [];

    // GET from AWS
    let hostname = window.location.hostname;
    let url = 'https://' + hostname + '/api';
    let jqxhr = await $.getJSON(url, function (data) {
      
    }).fail(function (jqxhr, textStatus, error) {
      history.push({
        expression: "Failed to update History",
        result: error
      });
      console.log("Request Failed: " + textStatus + ", " + error);
    }).done(function (data) {
      $.each(data, function (key, value) {
        history.push(value);
      });
    });

    console.log('history: ');
    console.log(JSON.stringify(history));
    this.resolve!(history);
  }
}
