require 'spec_helper'

describe LicensePresenter, :type => :view do
  let(:license) { License.instance }
  before do
    stub.proxy(license).[](anything)
  end

  let(:presenter) { LicensePresenter.new(license, view, {}) }
  let(:hash) { presenter.to_hash }

  let(:sample) do
    {
      :admins => 5,
      :developers => 10,
      :collaborators => 100,
      :level => 'triple-platinum',
      :vendor => 'openchorus',
      :organization_uuid => 'o-r-g',
      :expires => Date.parse('2014-07-31')
    }
  end

  describe 'to_hash' do
    it 'includes the license key/value pairs' do
      sample.each do |key, value|
        stub(license).[](key) { value }
      end

      sample.each do |key, value|
        hash[key].should == value
      end
    end

    it 'includes the work flow configuration' do
      stub(License.instance).workflow_enabled? { true }
      hash[:workflow_enabled].should be_true
    end

    it 'includes the branding' do
      stub(License.instance).branding { 'brands' }
      hash[:branding].should == 'brands'
    end

    it 'includes the search configuration' do
      stub(License.instance).full_search_enabled? { true }
      hash[:full_search_enabled].should be_true
    end

    it 'includes the advisor now configuration' do
      stub(License.instance).advisor_now_enabled? { true }
      hash[:advisor_now_enabled].should be_true
    end

    it 'includes limit_workspace_membership' do
      stub(License.instance).limit_workspace_membership? { true }
      hash[:limit_workspace_membership].should be_true
    end

    it 'includes limit_milestones' do
      stub(License.instance).limit_milestones? { true }
      hash[:limit_milestones].should be_true
    end

    it 'includes limit_jobs' do
      stub(License.instance).limit_jobs? { true }
      hash[:limit_jobs].should be_true
    end

    it 'includes home_page' do
      stub(License.instance).home_page { 'CustomHomePage' }
      hash[:home_page].should == 'CustomHomePage'
    end

    it 'includes limit_sandboxes?' do
      stub(License.instance).limit_sandboxes? { true }
      hash[:limit_sandboxes].should be_true
    end
  end
end
