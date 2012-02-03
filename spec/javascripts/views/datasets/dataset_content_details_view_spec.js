describe("chorus.views.DatasetContentDetails", function() {
    describe("#render", function() {
        beforeEach(function() {
            this.qtipMenu = stubQtip();
            this.collection = fixtures.databaseColumnSet();
            this.dataset = fixtures.datasetChorusView();
            this.view = new chorus.views.DatasetContentDetails({dataset: this.dataset, collection: this.collection});
            this.view.render();
        });

        it("puts the dataset filter subview in the filters div", function() {
            expect($(this.view.el).find(this.view.filterWizardView.el)).toBeTruthy();
        });

        it("renders the title", function() {
            expect(this.view.$(".data_preview h1").text().trim()).toMatchTranslation("dataset.data_preview")
        });

        it("renders the 'Preview Data' button", function() {
            expect(this.view.$(".column_count .preview").text().trim()).toMatchTranslation("dataset.data_preview");
        })

        it("hides the filters div", function() {
            expect(this.view.$(".filters")).toHaveClass("hidden");
        });

        context("when 'Preview Data' is clicked", function() {
            beforeEach(function() {
                this.view.$(".column_count .preview").click();
            })

            it("should hide the column count bar", function() {
                expect(this.view.$(".column_count")).toHaveClass("hidden");
            })

            it("should display the data preview bar", function() {
                expect(this.view.$(".data_preview")).not.toHaveClass("hidden");
            })

            describe("data preview bar", function() {
                it("should display a close button", function() {
                    expect(this.view.$(".data_preview .close")).toExist();
                })

                context("when the close button is clicked", function() {
                    beforeEach(function() {
                        this.view.$(".data_preview .close").click();
                    });

                    it("should hide the data preview bar", function() {
                        expect(this.view.$(".data_preview")).toHaveClass("hidden");
                    });

                    it("should show the column count bar", function() {
                        expect(this.view.$(".column_count")).not.toHaveClass("hidden");
                    });
                });

                context("when the preview data button is clicked", function() {
                    beforeEach(function() {
                        spyOn(this.view.preview, "fetch");
                        this.view.$(".preview").click();
                    });

                    it("should fetch the database preview model", function() {
                        expect(this.view.preview.fetch).toHaveBeenCalled();
                    });
                });
            })
        })

        describe("definition bar", function() {
            it("renders", function() {
                expect(this.view.$(".definition")).toExist();
            })

            it("renders the 'Transform' button", function() {
                expect(this.view.$("button.transform")).toExist();
                expect(this.view.$("button.transform").text()).toMatchTranslation("dataset.content_details.transform");
            })

            describe("the 'Transform' button is clicked", function() {
                beforeEach(function() {
                    this.view.$(".transform").click();
                })

                it("should show the qtip menu", function() {
                    expect(this.qtipMenu).toHaveVisibleQtip()
                })

                it("should render the qtip content", function() {
                    expect(this.qtipMenu).toContainTranslation("dataset.content_details.visualize")
                })

                context("and the visualize dataset link is clicked", function() {
                    beforeEach(function() {
                        this.visualizeSpy = spyOnEvent(this.view, "transform:visualize");
                        this.qtipMenu.find('.visualize').click();
                    })

                    it("selects the first chart type", function() {
                        expect(this.view.$('.create_chart .chart_icon:eq(0)')).toHaveClass('selected');
                    });

                    it("triggers the transform:visualize event for the first chart type", function() {
                        var chartType = this.view.$('.create_chart .chart_icon:eq(0)').data('chart_type');
                        expect("transform:visualize").toHaveBeenTriggeredOn(this.view, [chartType]);
                    });

                    it("hides the definition bar and shows the create_chart bar", function() {
                        expect(this.view.$('.definition')).toHaveClass('hidden');
                        expect(this.view.$('.create_chart')).not.toHaveClass('hidden');
                    });

                    it("hides column_count and shows info_bar", function() {
                        expect(this.view.$('.column_count')).toHaveClass('hidden');
                        expect(this.view.$('.info_bar')).not.toHaveClass('hidden');
                    });

                    it("shows the filters div", function () {
                        expect(this.view.$(".filters")).not.toHaveClass("hidden");
                    });

                    context("and cancel is clicked", function() {
                        beforeEach(function() {
                            spyOnEvent(this.view, "cancel:visualize");
                            this.view.$('.create_chart .cancel').click();
                        });

                        it("shows the definition bar and hides the create_chart bar", function() {
                            expect(this.view.$('.definition')).not.toHaveClass('hidden');
                            expect(this.view.$('.create_chart')).toHaveClass('hidden');
                        });

                        it("hides the filters div", function () {
                            expect(this.view.$(".filters")).toHaveClass("hidden");
                        });

                        it("shows the column_count and hides info_bar", function(){
                            expect(this.view.$('.column_count')).not.toHaveClass('hidden');
                            expect(this.view.$('.info_bar')).toHaveClass('hidden');
                        });

                        it("triggers the cancel:visualize event", function() {
                            expect("cancel:visualize").toHaveBeenTriggeredOn(this.view);
                        })
                    })

                    context("and a chart type is clicked", function() {
                        beforeEach(function() {
                            this.visualizeSpy.reset();
                            var chartIcon = this.view.$('.create_chart .chart_icon:eq(3)').click();
                            this.firstChartType = chartIcon.data('chart_type');
                        });

                        it("selects that icon", function() {
                            expect(this.view.$('.create_chart .chart_icon.' + this.firstChartType)).toHaveClass('selected');
                        });

                        it("triggers the transform:visualize event for the chart type", function() {
                            expect("transform:visualize").toHaveBeenTriggeredOn(this.view, [this.firstChartType]);
                        })

                        it("shows the title for that chart type", function() {
                            var chartType =
                            expect(this.view.$('.title.'+this.firstChartType)).not.toHaveClass('hidden');
                        })

                        context("and a different chart type is hovered over", function() {
                            beforeEach(function() {
                                var chartIcon = this.view.$('.create_chart .chart_icon:eq(2)');
                                this.hoverChartType = chartIcon.data('chart_type');
                                chartIcon.mouseenter();
                            });

                            it("shows the title for the hovered icon and hides the selected title", function() {
                                expect(this.view.$('.title.'+this.hoverChartType)).not.toHaveClass('hidden');
                                expect(this.view.$('.title.'+this.firstChartType)).toHaveClass('hidden');
                            });

                            context("and we stop hovering", function() {
                                beforeEach(function() {
                                    var chartIcon = this.view.$('.create_chart .chart_icon:eq(2)');
                                    chartIcon.mouseleave();
                                });

                                it("shows the selected title for the hovered icon and hides the hovered title", function() {
                                    expect(this.view.$('.title.'+this.hoverChartType)).toHaveClass('hidden');
                                    expect(this.view.$('.title.'+this.firstChartType)).not.toHaveClass('hidden');
                                });
                            })
                        })

                        context("and a different chart type is clicked", function() {
                            beforeEach(function() {
                                var chartIcon = this.view.$('.create_chart .chart_icon:eq(1)').click();
                                this.secondChartType = chartIcon.data('chart_type');
                            });

                            it("selects that icon", function() {
                                expect(this.view.$('.create_chart .chart_icon:eq(0)')).not.toHaveClass('selected');
                                expect(this.view.$('.create_chart .chart_icon:eq(1)')).toHaveClass('selected');
                            });

                            it("shows that title and hides the other visible ones", function() {
                                expect(this.view.$('.title.'+this.secondChartType)).not.toHaveClass('hidden');
                                expect(this.view.$('.title.'+this.firstChartType)).toHaveClass('hidden');
                            })
                        })
                    })
                })
            })
        })

        describe("column count bar", function() {
            it("renders", function() {
                expect(this.view.$(".column_count")).toExist();
            })

            it("renders the column count", function() {
                expect(this.view.$(".column_count .count").text().trim()).toMatchTranslation("dataset.column_count", { count: this.collection.models.length })
            })
        })
    })
});
