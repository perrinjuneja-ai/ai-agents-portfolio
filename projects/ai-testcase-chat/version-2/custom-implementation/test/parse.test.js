const { expect } = require('chai');
const { parseTestcasesFromText } = require('../parse');

describe('parseTestcasesFromText', ()=>{
  it('parses pipe-separated single line', ()=>{
    const input = 'TC-1 | Description | Step1; Step2 | Expected | High';
    const rows = parseTestcasesFromText(input);
    expect(rows).to.have.length(1);
    expect(rows[0].id).to.equal('TC-1');
    expect(rows[0].desc).to.include('Description');
  });

  it('parses markdown table', ()=>{
    const input = '| TC ID | Description | Steps | Expected Result | Priority |\n|---|---|---|---|---|\n| TC-2 | Do X | Step A | OK | Medium |';
    const rows = parseTestcasesFromText(input);
    expect(rows).to.have.length(1);
    expect(rows[0].id).to.equal('TC-2');
    expect(rows[0].priority).to.equal('Medium');
  });

  it('parses JSON array', ()=>{
    const input = JSON.stringify([{ id:'TC-3', description:'d', steps:'s', expected:'e', priority:'Low' }]);
    const rows = parseTestcasesFromText(input);
    expect(rows).to.have.length(1);
    expect(rows[0].id).to.equal('TC-3');
  });

  it('fallback uses full text as description', ()=>{
    const input = 'Some long freeform testcase description without pipes';
    const rows = parseTestcasesFromText(input);
    expect(rows).to.have.length(1);
    expect(rows[0].desc).to.include('Some long freeform');
  });
});
