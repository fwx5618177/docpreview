import gulp from 'gulp'
import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'
import { rollup } from 'rollup'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import rollupConfig from './rollup.config.js'

const series = gulp.series

const log = {
    progress: text => {
        console.log(chalk.green(text))
    },
    error: text => {
        console.log(chalk.red(text))
    },
}

const paths = {
    root: path.join(__dirname, '/'),
    lib: path.join(__dirname, '/lib'),
}

// 删除 lib 文件
const clearLibFile = async cb => {
    fse.removeSync(paths.lib)
    log.progress('Deleted lib file')
    cb()
}

// rollup 打包
const buildByRollup = async cb => {
    rollupConfig?.forEach(async ci => {
        const bundle = await rollup(ci)
        await bundle.write(ci?.output)
        cb()
    })
    log.progress('Rollup built successfully')
}

// api-extractor 整理 .d.ts 文件
const apiExtractorGenerate = async cb => {
    const apiExtractorJsonPath = path.join(__dirname, './api-extractor.json')
    // 加载并解析 api-extractor.json 文件
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath)
    console.log(extractorConfig)

    // 判断是否存在 index.d.ts 文件，这里必须异步先访问一边，不然后面找不到会报错
    const isExist = await fse.pathExists(extractorConfig.mainEntryPointFilePath)

    if (!isExist) {
        log.error('API Extractor not find index.d.ts')
        return
    }

    // 调用 API
    const extractorResult = await Extractor.invoke(extractorConfig, {
        localBuild: true,
        // 在输出中显示信息
        showVerboseMessages: true,
    })

    if (extractorResult.succeeded) {
        // 删除多余的 .d.ts 文件
        const libFiles = await fse.readdir(paths.lib)
        libFiles.forEach(async file => {
            if (file.endsWith('.d.ts') && !file.includes('index')) {
                await fse.remove(path.join(paths.lib, file))
            }
        })
        log.progress('API Extractor completed successfully')
        cb()
    } else {
        log.error(`API Extractor completed with ${extractorResult.errorCount} errors` + ` and ${extractorResult.warningCount} warnings`)
    }
}

const complete = cb => {
    log.progress('---- end ----')
    cb()
}

// 构建过程
// 1. 删除 lib 文件夹
// 2. rollup 打包
// 3. api-extractor 生成统一的声明文件, 删除多余的声明文件
// 4. 完成
export const build = series(clearLibFile, buildByRollup, apiExtractorGenerate, complete)
