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
      alert(error.message);
    }
  }

  async addToHistory(expression, result) {
    // POST to AWS for updating MongoDB
    let data = {
      expression: expression,
      result: result
    }
    var jqxhr = await $.post("https://brh7zy5qv2.execute-api.us-east-1.amazonaws.com/prod", data, function () {
      console.log('Sending: ' + data);
    },"json").done(function () {
        
    }).fail(function (jqxhr, textStatus, error) {
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
    let jqxhr = await $.getJSON("https://brh7zy5qv2.execute-api.us-east-1.amazonaws.com/prod", function (data) {
      
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
