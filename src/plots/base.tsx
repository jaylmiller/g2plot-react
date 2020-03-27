import React, { HTMLAttributes } from 'react'
import omit from 'lodash/omit'
import map from 'lodash/map'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { Base as BasePlot, ViewLayer, PlotConfig } from '@antv/g2plot'

type PickedAttrs = 'className' | 'style'

export type LayerCtor<C> = ViewLayer<C>

export interface Plot<C extends PlotConfig = PlotConfig> {
  new (container: HTMLElement, props: C): BasePlot<C, LayerCtor<C>>
}

export interface BaseChartProps<C extends PlotConfig = PlotConfig>
  extends Pick<HTMLAttributes<HTMLDivElement>, PickedAttrs> {
  chart: Plot<C>
  onMount?: (chart: BasePlot<C, LayerCtor<C>>) => void
}

export default class BaseChart<
  C extends PlotConfig = PlotConfig
> extends React.Component<BaseChartProps<C>> {
  private el: HTMLDivElement | null = null
  private chart?: BasePlot<C, LayerCtor<C>> | null
  private config?: any
  private getContainer = (el: HTMLDivElement | null) => {
    this.el = el
  }

  private getConfig = (props: BaseChartProps<C>) => {
    return omit(props, ['style', 'className', 'chart', 'onMount']) as C
  }

  private getFnKeys = (config: any): string[] => {
    const keys = [] as string[]
    const recursive = (obj: any, parents: string[]) => {
      map(obj, (val, key) => {
        if (typeof val === 'object') return recursive(val, [...parents, key])
        if (typeof val === 'function') keys.push([...parents, key].join('.'))
      })
    }
    recursive(config, [])
    return keys
  }

  componentDidMount() {
    const { chart, onMount } = this.props
    const config = this.getConfig(this.props)
    const Chart = chart
    const { data, ...restConfig } = config as any
    this.config = cloneDeep(restConfig)
    if (this.el) {
      this.chart = new Chart(this.el, config)
      this.chart.render()
      if (typeof onMount === 'function') {
        onMount(this.chart)
      }
    }
  }

  componentDidUpdate() {
    const config = this.getConfig(this.props)
    const { data, ...restConfig } = config as any
    const thisFnKeys = this.getFnKeys(this.config)
    const restFnKeys = this.getFnKeys(restConfig)
    const isConfigChanged = !isEqual(
      omit(this.config, thisFnKeys),
      omit(restConfig, restFnKeys)
    )
    /* istanbul ignore else */
    if (this.chart) {
      if (isConfigChanged) {
        this.config = cloneDeep(restConfig)
        this.chart.updateConfig(config as any)
        this.chart.render()
      } else {
        this.chart.changeData(data)
      }
    }
  }

  componentWillUnmount() {
    /* istanbul ignore else */
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  }

  render() {
    const { style, className } = this.props
    return <div ref={this.getContainer} className={className} style={style} />
  }
}
