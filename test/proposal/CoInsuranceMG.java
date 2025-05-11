package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.util.List;

/**
 * @Author fuyuanjie
 * @Date 2024/12/4
 * 共保信息
 */

@Data
public class CoInsuranceMG {

    /**
     * 共保参与方信息
     */
    private List<CoGuarantorMG> coGuarantorList;

    /**
     * 保费收取方式
     * 02	主代从收
     * 03	各收各份额
     */
    private String premiumCollectMethodCd;
}
